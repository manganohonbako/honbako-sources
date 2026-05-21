// Example source — copy this file and adapt it to add a new source.
const source = {
  id: 'example',
  name: 'Example Source',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,

  // Request builders return { url: string, headers?: object }.
  // Swift fetches the URL and passes the response body to the matching parser.

  searchRequest(query, page, lang) {
    const offset = (page - 1) * 20;
    return {
      url: `https://api.example.com/manga?title=${encodeURIComponent(query)}&offset=${offset}&lang=${lang}`,
    };
  },

  detailRequest(mangaId) {
    return {
      url: `https://api.example.com/manga/${mangaId}`,
    };
  },

  chaptersRequest(mangaId) {
    return {
      url: `https://api.example.com/manga/${mangaId}/chapters`,
    };
  },

  pagesRequest(chapterId) {
    return {
      url: `https://api.example.com/chapter/${chapterId}/pages`,
    };
  },

  // Parsers receive the raw response body string and return a JSON string.

  parseSearch(body) {
    const json = JSON.parse(body);
    const results = json.results.map(function(item) {
      return {
        id: item.id,
        title: item.title,
        coverUrl: item.coverUrl || null,
      };
    });
    return JSON.stringify(results);
  },

  parseDetail(body) {
    const json = JSON.parse(body);
    return JSON.stringify({
      id: json.id,
      title: json.title,
      synopsis: json.description || '',
      author: json.author || null,
      status: json.status,
      tags: json.genres || [],
    });
  },

  parseChapters(body) {
    const json = JSON.parse(body);
    const chapters = json.chapters.map(function(ch) {
      return {
        id: ch.id,
        title: ch.title || '',
        number: ch.number || '0',
        lang: ch.lang,
        date: ch.publishedAt,
      };
    });
    return JSON.stringify(chapters);
  },

  parsePages(body) {
    const json = JSON.parse(body);
    return JSON.stringify(json.pages);
  },
};
