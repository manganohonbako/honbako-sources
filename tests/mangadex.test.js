const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadSource(name) {
  const code = fs.readFileSync(
    path.join(__dirname, `../sources/${name}.js`),
    'utf8'
  );
  const ctx = vm.createContext({});
  // Append globalThis assignment so the const is accessible from Node side
  vm.runInContext(code + '\nglobalThis.source = source;', ctx);
  return ctx.source;
}

const source = loadSource('mangadex');

describe('shape', () => {
  test('has required metadata fields', () => {
    expect(source.id).toBe('mangadex');
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
  test('searchRequest builds correct URL with encoded query and offset', () => {
    const req = source.searchRequest('naruto uzumaki', 2, 'en');
    expect(req).toHaveProperty('url');
    expect(req.url).toContain('https://api.mangadex.org/manga');
    expect(req.url).toContain('title=naruto%20uzumaki');
    expect(req.url).toContain('offset=20');
    expect(req.url).toContain('limit=20');
    expect(req.url).toContain('translatedLanguage[]=en');
  });

  test('searchRequest page 1 has offset 0', () => {
    const req = source.searchRequest('berserk', 1, 'en');
    expect(req.url).toContain('offset=0');
  });

  test('detailRequest includes author and cover_art', () => {
    const req = source.detailRequest('manga-id-abc');
    expect(req.url).toBe(
      'https://api.mangadex.org/manga/manga-id-abc?includes[]=author&includes[]=cover_art'
    );
  });

  test('chaptersRequest builds feed URL', () => {
    const req = source.chaptersRequest('manga-id-abc');
    expect(req.url).toContain('https://api.mangadex.org/manga/manga-id-abc/feed');
    expect(req.url).toContain('translatedLanguage[]=en');
    expect(req.url).toContain('order[chapter]=desc');
    expect(req.url).toContain('limit=96');
  });

  test('pagesRequest uses at-home endpoint', () => {
    const req = source.pagesRequest('chapter-id-xyz');
    expect(req.url).toBe('https://api.mangadex.org/at-home/server/chapter-id-xyz');
  });
});
