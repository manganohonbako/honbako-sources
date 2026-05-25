const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSource(name) {
  const code = fs.readFileSync(
    path.join(__dirname, `../sources/${name}.js`),
    'utf8'
  );
  const ctx = vm.createContext({ __config: { baseURL: 'http://localhost:4567' } });
  vm.runInContext(code + '\nglobalThis.source = source;', ctx);
  return ctx.source;
}

const source = loadSource('suwayomi');
const fixture = name =>
  fs.readFileSync(path.join(__dirname, `fixtures/${name}`), 'utf8');

describe('shape', () => {
  test('has required metadata fields', () => {
    expect(source.id).toBe('suwayomi');
    expect(typeof source.name).toBe('string');
    expect(typeof source.version).toBe('string');
    expect(Array.isArray(source.langs)).toBe(true);
    expect(typeof source.nsfw).toBe('boolean');
    expect(source.allowHTTP).toBe(true);
  });

  test('has all 8 interface methods', () => {
    const methods = [
      'searchRequest', 'detailRequest', 'chaptersRequest', 'pagesRequest',
      'parseSearch', 'parseDetail', 'parseChapters', 'parsePages',
    ];
    for (const m of methods) {
      expect(typeof source[m]).toBe('function');
    }
  });
});

describe('request builders', () => {
  test('searchRequest posts to /api/graphql with title filter', () => {
    const req = source.searchRequest('naruto uzumaki', 1, 'en');
    expect(req.url).toBe('http://localhost:4567/api/graphql');
    expect(req.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(req.body);
    expect(typeof body.query).toBe('string');
    expect(body.variables.filter).toEqual([{ title: { includesInsensitive: 'naruto uzumaki' } }]);
    expect(body.variables.offset).toBe(0);
    expect(body.variables.first).toBe(20);
  });

  test('searchRequest page 2 uses offset 20', () => {
    const req = source.searchRequest('berserk', 2, 'en');
    const body = JSON.parse(req.body);
    expect(body.variables.offset).toBe(20);
  });

  test('searchRequest empty query sends empty filter array', () => {
    const req = source.searchRequest('', 1, 'en');
    const body = JSON.parse(req.body);
    expect(body.variables.filter).toEqual([]);
  });

  test('searchRequest strips trailing slash from baseURL', () => {
    const code = fs.readFileSync(
      path.join(__dirname, '../sources/suwayomi.js'),
      'utf8'
    );
    const ctx = vm.createContext({ __config: { baseURL: 'http://localhost:4567/' } });
    vm.runInContext(code + '\nglobalThis.source = source;', ctx);
    const src = ctx.source;
    const req = src.searchRequest('test', 1, 'en');
    expect(req.url).not.toContain('//api');
    expect(req.url).toContain('localhost:4567/api');
  });

  test('detailRequest posts correct mangaId variable', () => {
    const req = source.detailRequest('1');
    expect(req.url).toBe('http://localhost:4567/api/graphql');
    const body = JSON.parse(req.body);
    expect(body.variables.id).toBe(1);
  });

  test('chaptersRequest posts correct mangaId variable', () => {
    const req = source.chaptersRequest('1');
    expect(req.url).toBe('http://localhost:4567/api/graphql');
    const body = JSON.parse(req.body);
    expect(body.variables.mangaId).toBe(1);
  });

  test('pagesRequest posts correct chapterId variable', () => {
    const req = source.pagesRequest('42');
    expect(req.url).toBe('http://localhost:4567/api/graphql');
    const body = JSON.parse(req.body);
    expect(body.variables.id).toBe(42);
  });
});

describe('parsers', () => {
  test('parseSearch returns array of { id, title, coverUrl }', () => {
    const results = JSON.parse(source.parseSearch(fixture('suwayomi-search.json')));
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1');
    expect(results[0].title).toBe('Naruto');
    expect(results[0].coverUrl).toBe('http://localhost:4567/api/v1/manga/1/thumbnail');
    expect(results[1].id).toBe('2');
    expect(results[1].title).toBe('Berserk');
  });

  test('parseDetail returns { id, title, synopsis, author, status, tags }', () => {
    const detail = JSON.parse(source.parseDetail(fixture('suwayomi-detail.json')));
    expect(detail.id).toBe('1');
    expect(detail.title).toBe('Naruto');
    expect(detail.synopsis).toBe('A story about a ninja who wants to be Hokage.');
    expect(detail.author).toBe('Masashi Kishimoto');
    expect(detail.status).toBe('Completed');
    expect(Array.isArray(detail.tags)).toBe(true);
    expect(detail.tags).toContain('Action');
    expect(detail.tags).toContain('Shounen');
  });

  test('parseChapters returns array of { id, title, number, lang, date }', () => {
    const chapters = JSON.parse(source.parseChapters(fixture('suwayomi-chapters.json')));
    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].id).toBe('42');
    expect(chapters[0].title).toBe('Chapter 1: Enter Naruto Uzumaki!');
    expect(chapters[0].number).toBe(1.0);
    expect(chapters[0].lang).toBe('en');
    expect(typeof chapters[0].date).toBe('string');
    expect(chapters[0].date).not.toBe('');
  });

  test('parsePages returns full page URLs prefixed with baseURL', () => {
    const urls = JSON.parse(source.parsePages(fixture('suwayomi-pages.json')));
    expect(Array.isArray(urls)).toBe(true);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe('http://localhost:4567/api/v1/chapter/42/page/0');
    expect(urls[1]).toBe('http://localhost:4567/api/v1/chapter/42/page/1');
    expect(urls[2]).toBe('http://localhost:4567/api/v1/chapter/42/page/2');
  });
});
