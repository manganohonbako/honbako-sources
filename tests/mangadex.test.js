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
