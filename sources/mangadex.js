const source = {
  id: 'mangadex',
  name: 'MangaDex',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,

  searchRequest(query, page, lang) {
    const offset = (page - 1) * 20;
    return {
      url: `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=20&offset=${offset}&translatedLanguage[]=${lang}&includes[]=cover_art`,
    };
  },
  detailRequest(mangaId) {
    return {
      url: `https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=cover_art`,
    };
  },
  chaptersRequest(mangaId) {
    // lang not parameterized — Swift protocol passes only mangaId; use source.langs[0]
    return {
      url: `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=96`,
    };
  },
  pagesRequest(chapterId) {
    return {
      url: `https://api.mangadex.org/at-home/server/${chapterId}`,
    };
  },
  parseSearch(body) {
    const json = JSON.parse(body);
    const results = json.data.map(function(manga) {
      const coverRel = manga.relationships.find(function(r) { return r.type === 'cover_art'; });
      const coverUrl = coverRel
        ? 'https://uploads.mangadex.org/covers/' + manga.id + '/' + coverRel.attributes.fileName
        : null;
      const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0];
      return { id: manga.id, title: title, coverUrl: coverUrl };
    });
    return JSON.stringify(results);
  },
  parseDetail(body) {
    const json = JSON.parse(body);
    const d = json.data;
    const authorRel = d.relationships.find(function(r) { return r.type === 'author'; });
    const title = d.attributes.title.en || Object.values(d.attributes.title)[0];
    const synopsis = d.attributes.description.en || Object.values(d.attributes.description)[0] || '';
    const tags = d.attributes.tags.map(function(t) {
      return t.attributes.name.en || Object.values(t.attributes.name)[0];
    });
    return JSON.stringify({
      id: d.id,
      title: title,
      synopsis: synopsis,
      author: authorRel ? authorRel.attributes.name : null,
      status: d.attributes.status,
      tags: tags,
    });
  },
  parseChapters(body) {
    const json = JSON.parse(body);
    const chapters = json.data.map(function(ch) {
      return {
        id: ch.id,
        title: ch.attributes.title || '',
        number: ch.attributes.chapter || '0',
        lang: ch.attributes.translatedLanguage,
        date: ch.attributes.publishAt,
      };
    });
    return JSON.stringify(chapters);
  },
  parsePages(body) {
    const json = JSON.parse(body);
    const baseUrl = json.baseUrl;
    const hash = json.chapter.hash;
    const urls = json.chapter.data.map(function(filename) {
      return baseUrl + '/data/' + hash + '/' + filename;
    });
    return JSON.stringify(urls);
  },
};
