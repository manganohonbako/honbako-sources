const source = {
  id: 'suwayomi',
  name: 'Suwayomi',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,
  allowHTTP: true,

  _base() {
    return (__config.baseURL || '').replace(/\/$/, '');
  },

  searchRequest(query, page) {
    return {
      url: `${this._base()}/api/v1/manga?searchTerm=${encodeURIComponent(query)}&pageNum=${page}`,
    };
  },

  detailRequest(mangaId) {
    return { url: `${this._base()}/api/v1/manga/${mangaId}` };
  },

  chaptersRequest(mangaId) {
    return { url: `${this._base()}/api/v1/manga/${mangaId}/chapters?onlineFetch=false` };
  },

  pagesRequest(chapterId) {
    return { url: `${this._base()}/api/v1/chapter/${chapterId}` };
  },

  parseSearch(body) {
    const { mangaList } = JSON.parse(body);
    return JSON.stringify(
      mangaList.map(m => ({
        id: String(m.id),
        title: m.title,
        coverUrl: m.thumbnailUrl || null,
      }))
    );
  },

  parseDetail(body) {
    const m = JSON.parse(body);
    return JSON.stringify({
      id: String(m.id),
      title: m.title,
      synopsis: m.description || '',
      author: m.author || '',
      status: m.status || '',
      tags: m.genre || [],
    });
  },

  parseChapters(body) {
    const { chapters } = JSON.parse(body);
    return JSON.stringify(
      chapters.map(c => ({
        id: String(c.id),
        title: c.name || '',
        number: c.chapterNumber,
        lang: 'en',
        date: c.uploadDate ? new Date(c.uploadDate).toISOString() : '',
      }))
    );
  },

  parsePages(body) {
    const { chapter } = JSON.parse(body);
    const base = this._base();
    const pages = [];
    for (let i = 0; i < chapter.pageCount; i++) {
      pages.push(`${base}/api/v1/chapter/${chapter.id}/page/${i}`);
    }
    return JSON.stringify(pages);
  },
};
