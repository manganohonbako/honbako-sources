const source = {
  id: 'mangadex',
  name: 'MangaDex',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,

  searchRequest(_query, _page, _lang) {
    throw new Error('not implemented');
  },
  detailRequest(_mangaId) {
    throw new Error('not implemented');
  },
  chaptersRequest(_mangaId) {
    throw new Error('not implemented');
  },
  pagesRequest(_chapterId) {
    throw new Error('not implemented');
  },
  parseSearch(_body) {
    throw new Error('not implemented');
  },
  parseDetail(_body) {
    throw new Error('not implemented');
  },
  parseChapters(_body) {
    throw new Error('not implemented');
  },
  parsePages(_body) {
    throw new Error('not implemented');
  },
};
