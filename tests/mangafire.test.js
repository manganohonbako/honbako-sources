const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSource(name) {
  const code = fs.readFileSync(
    path.join(__dirname, `../sources/${name}.js`),
    'utf8'
  );
  const ctx = vm.createContext({});
  vm.runInContext(code + '\nglobalThis.source = source;', ctx);
  return ctx.source;
}

const source = loadSource('mangafire');
const fixture = name =>
  fs.readFileSync(path.join(__dirname, `fixtures/${name}`), 'utf8');

describe('shape', () => {
  test('has required metadata fields', () => {
    expect(source.id).toBe('mangafire');
    expect(typeof source.name).toBe('string');
    expect(typeof source.version).toBe('string');
    expect(Array.isArray(source.langs)).toBe(true);
    expect(typeof source.nsfw).toBe('boolean');
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
  test('searchRequest builds filter URL with encoded keyword and vrf', () => {
    const req = source.searchRequest('naruto uzumaki', 2, 'en');
    expect(req).toHaveProperty('url');
    expect(req.url).toContain('https://mangafire.to/filter');
    expect(req.url).toContain('keyword=naruto%20uzumaki');
    expect(req.url).toContain('page=2');
    expect(req.url).toContain('language%5B%5D=en');
    expect(req.url).toContain('vrf=');
    const vrfParam = new URLSearchParams(req.url.split('?')[1]).get('vrf');
    expect(vrfParam).toBeTruthy();
    expect(vrfParam.length).toBeGreaterThan(10);
  });

  test('searchRequest page 1 has page=1', () => {
    const req = source.searchRequest('berserk', 1, 'en');
    expect(req.url).toContain('page=1');
  });

  test('searchRequest with empty query omits keyword and vrf', () => {
    const req = source.searchRequest('', 1, 'en');
    expect(req.url).not.toContain('keyword=');
    expect(req.url).not.toContain('vrf=');
    expect(req.url).toContain('https://mangafire.to/filter');
  });

  test('detailRequest builds manga detail URL', () => {
    const req = source.detailRequest('narutoo.l33');
    expect(req.url).toBe('https://mangafire.to/manga/narutoo.l33');
  });

  test('chaptersRequest builds ajax/read URL with vrf', () => {
    const req = source.chaptersRequest('narutoo.l33');
    expect(req.url).toContain('https://mangafire.to/ajax/read/l33/chapter/en');
    expect(req.url).toContain('vrf=');
    expect(req.headers).toHaveProperty('X-Requested-With', 'XMLHttpRequest');
  });

  test('chaptersRequest extracts numeric id after last dot', () => {
    const req = source.chaptersRequest('one-piece.ov9');
    expect(req.url).toContain('/ajax/read/ov9/chapter/en');
  });

  test('pagesRequest builds ajax/read/chapter URL with vrf', () => {
    const req = source.pagesRequest('5355431');
    expect(req.url).toContain('https://mangafire.to/ajax/read/chapter/5355431');
    expect(req.url).toContain('vrf=');
    expect(req.headers).toHaveProperty('X-Requested-With', 'XMLHttpRequest');
  });
});

describe('parsers', () => {
  test('parseSearch returns array of { id, title, coverUrl }', () => {
    const results = JSON.parse(source.parseSearch(fixture('mangafire-search.json')));
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(29);
    expect(results[0].id).toBe('narutoo.l33');
    expect(results[0].title).toBe('Naruto');
    expect(results[0].coverUrl).toBe('https://static.mfcdn.nl/6a68/i/5/51/51360d75d5ffa0cc3234dc79d9c36d26.jpg');
  });

  test('parseDetail placeholder', () => { expect(true).toBe(true); });
  test('parseChapters placeholder', () => { expect(true).toBe(true); });
  test('parsePages placeholder', () => { expect(true).toBe(true); });
});
