const source = {
  id: 'suwayomi',
  name: 'Suwayomi',
  version: '2.0.3',
  langs: ['en'],
  nsfw: false,
  allowHTTP: true,

  _base() {
    return (__config.baseURL || '').replace(/\/$/, '');
  },

  _gql(query, variables) {
    return {
      url: `${this._base()}/api/graphql`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    };
  },

  searchRequest(query, page) {
    const filter = query ? [{ title: { includesInsensitive: query } }] : [];
    const offset = (page - 1) * 20;
    return this._gql(
      `query SearchManga($filter: [MangaFilterInput!], $first: Int, $offset: Int) {
        mangas(condition: {inLibrary: true}, filter: {and: $filter}, first: $first, offset: $offset) {
          nodes { id title thumbnailUrl }
        }
      }`,
      { filter, first: 20, offset }
    );
  },

  detailRequest(mangaId) {
    return this._gql(
      `query GetManga($id: Int!) {
        manga(id: $id) { id title description author status genre thumbnailUrl }
      }`,
      { id: parseInt(mangaId, 10) }
    );
  },

  chaptersRequest(mangaId) {
    return this._gql(
      `query GetChapters($mangaId: Int!) {
        chapters(condition: {mangaId: $mangaId}, orderBy: SOURCE_ORDER, orderByType: DESC) {
          nodes { id name chapterNumber uploadDate }
        }
      }`,
      { mangaId: parseInt(mangaId, 10) }
    );
  },

  pagesRequest(chapterId) {
    return this._gql(
      `mutation GetPages($id: Int!) {
        fetchChapterPages(input: {chapterId: $id}) { pages }
      }`,
      { id: parseInt(chapterId, 10) }
    );
  },

  _absoluteUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${this._base()}${path}`;
  },

  parseSearch(body) {
    const { data } = JSON.parse(body);
    return JSON.stringify(
      data.mangas.nodes.map(m => ({
        id: String(m.id),
        title: m.title,
        coverUrl: this._absoluteUrl(m.thumbnailUrl),
      }))
    );
  },

  parseDetail(body) {
    const { data } = JSON.parse(body);
    const m = data.manga;
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
    const { data } = JSON.parse(body);
    return JSON.stringify(
      data.chapters.nodes.map(c => ({
        id: String(c.id),
        title: c.name || '',
        number: String(c.chapterNumber ?? ''),
        lang: 'en',
        date: (() => { try { const ms = Number(c.uploadDate); return ms > 0 ? new Date(ms).toISOString() : ''; } catch (e) { return ''; } })(),
      }))
    );
  },

  parsePages(body) {
    const { data } = JSON.parse(body);
    const base = this._base();
    return JSON.stringify(data.fetchChapterPages.pages.map(p => `${base}${p}`));
  },
};
