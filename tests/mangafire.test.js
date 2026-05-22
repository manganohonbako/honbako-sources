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

  test('parseSearch decodes HTML entities in titles', () => {
    const results = JSON.parse(source.parseSearch(fixture('mangafire-search.json')));
    const entityTitle = results.find(r => r.title.includes("Konoha's Story"));
    expect(entityTitle).toBeDefined();
    expect(entityTitle.title).not.toContain('&#039;');
  });

  test('parseDetail returns { id, title, synopsis, author, status, tags }', () => {
    const detail = JSON.parse(source.parseDetail(fixture('mangafire-detail.json')));
    expect(detail.id).toBe('narutoo.l33');
    expect(detail.title).toBe('Naruto');
    expect(detail.synopsis).toContain("Despite Naruto Uzumaki");
    expect(detail.author).toBe('Masashi Kishimoto');
    expect(detail.status).toBe('completed');
    expect(Array.isArray(detail.tags)).toBe(true);
    expect(detail.tags).toContain('Action');
    expect(detail.tags).toContain('Shounen');
  });
  test('parseChapters returns array of { id, title, number, lang, date }', () => {
    const chapters = JSON.parse(source.parseChapters(fixture('mangafire-chapters.json')));
    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters).toHaveLength(790);
    expect(chapters[0].id).toBe('5355431');
    expect(chapters[0].number).toBe('700.6');
    expect(chapters[0].title).toContain('Side Story');
    expect(chapters[0].lang).toBe('en');
    expect(typeof chapters[0].date).toBe('string');
  });
  test('parsePages returns array of URL strings', () => {
    const urls = JSON.parse(source.parsePages(fixture('mangafire-pages.json')));
    expect(Array.isArray(urls)).toBe(true);
    expect(urls).toHaveLength(50);
    expect(urls[0]).toBe('https://l1n.mfcdn1.xyz/mf/12a3db61fa0a4f41a692795a92a7ee0f9a30a9475da7beb2541e2dfab23ccb812a5cd519486725eaff/h/p.jpg');
    expect(typeof urls[0]).toBe('string');
  });
});
