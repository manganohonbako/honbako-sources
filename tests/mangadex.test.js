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
const fixture = name =>
  fs.readFileSync(path.join(__dirname, `fixtures/${name}`), 'utf8');

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
    expect(req.url).toContain('includes[]=cover_art');
  });

  test('searchRequest page 1 has offset 0', () => {
    const req = source.searchRequest('berserk', 1, 'en');
    expect(req.url).toContain('offset=0');
  });

  test('searchRequest omits title param when query is empty', () => {
    const req = source.searchRequest('', 1, 'en');
    expect(req.url).not.toContain('title=');
    expect(req.url).toContain('https://api.mangadex.org/manga');
    expect(req.url).toContain('limit=20');
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

describe('parsers', () => {
  test('parseSearch returns array of { id, title, coverUrl }', () => {
    const results = JSON.parse(source.parseSearch(fixture('mangadex-search.json')));
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('32d76d19-8a05-4db0-a917-d6b97d3b5ea7');
    expect(results[0].title).toBe('Naruto');
    expect(results[0].coverUrl).toContain('32d76d19-8a05-4db0-a917-d6b97d3b5ea7');
    expect(results[0].coverUrl).toContain('cover.jpg');
  });

  test('parseSearch sets coverUrl to null when cover_art relationship is absent', () => {
    const results = JSON.parse(source.parseSearch(fixture('mangadex-search.json')));
    expect(results).toHaveLength(2);
    expect(results[1].id).toBe('no-cover-manga-id');
    expect(results[1].coverUrl).toBeNull();
  });

  test('parseDetail returns { id, title, synopsis, author, status, tags }', () => {
    const detail = JSON.parse(source.parseDetail(fixture('mangadex-detail.json')));
    expect(detail.id).toBe('32d76d19-8a05-4db0-a917-d6b97d3b5ea7');
    expect(detail.title).toBe('Naruto');
    expect(detail.synopsis).toBe('A story about a ninja.');
    expect(detail.author).toBe('Masashi Kishimoto');
    expect(detail.status).toBe('completed');
    expect(Array.isArray(detail.tags)).toBe(true);
    expect(detail.tags).toContain('Action');
  });

  test('parseChapters returns array of { id, title, number, lang, date }', () => {
    const chapters = JSON.parse(source.parseChapters(fixture('mangadex-chapters.json')));
    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].id).toBe('ch-001');
    expect(chapters[0].title).toBe('Enter: Naruto Uzumaki!');
    expect(chapters[0].number).toBe('1');
    expect(chapters[0].lang).toBe('en');
    expect(chapters[0].date).toBe('2004-10-01T00:00:00+00:00');
  });

  test('parsePages assembles full image URLs from baseUrl + hash + filename', () => {
    const urls = JSON.parse(source.parsePages(fixture('mangadex-pages.json')));
    expect(Array.isArray(urls)).toBe(true);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe('https://uploads.mangadex.org/data/abc123def456/page-1.jpg');
    expect(urls[1]).toBe('https://uploads.mangadex.org/data/abc123def456/page-2.jpg');
  });
});
