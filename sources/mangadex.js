const source = {
  id: 'mangadex',
  name: 'MangaDex',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,

  searchRequest(query, page, lang) {
    const offset = (page - 1) * 20;
    return {
      url: `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=20&offset=${offset}&translatedLanguage[]=${lang}`,
    };
  },
  detailRequest(mangaId) {
    return {
      url: `https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=cover_art`,
    };
  },
  chaptersRequest(mangaId) {
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
    throw new Error('not implemented');
  },
  parseDetail(body) {
    throw new Error('not implemented');
  },
  parseChapters(body) {
    throw new Error('not implemented');
  },
  parsePages(body) {
    throw new Error('not implemented');
  },
};
