# CLAUDE.md

Guide for writing Honbako source extensions.

## Build & Test

```bash
npm install
npm test
npm run lint
npm run lint:fix
```

## JS Source Interface

Each `sources/*.js` file must export a single `const source` object:

```javascript
const source = {
  // Required metadata
  id: 'stable-unique-id',   // never change after publishing
  name: 'Display Name',
  version: '1.0.0',
  langs: ['en'],
  nsfw: false,

  // Request builders — return { url: string, headers?: object }
  searchRequest(query, page, lang) { ... },
  detailRequest(mangaId) { ... },
  chaptersRequest(mangaId) { ... },
  pagesRequest(chapterId) { ... },

  // Response parsers — receive response body string, return JSON string
  parseSearch(body) { ... },    // → [{ id, title, coverUrl }]
  parseDetail(body) { ... },    // → { id, title, synopsis, author, status, tags }
  parseChapters(body) { ... },  // → [{ id, title, number, lang, date }]
  parsePages(body) { ... },     // → [url_string, ...]
};
```

## JSCore Constraints

Sources run in JavaScriptCore (iOS), not Node.js or a browser:
- No `import` / `require` / `module.exports`
- No `fetch`, `XMLHttpRequest`, or any network API — Swift handles all HTTP
- No `document`, `window`, or DOM APIs
- No `setTimeout`, `Promise`, or `async/await` — all methods must be synchronous
- ES2020 syntax is supported (arrow functions, template literals, destructuring, etc.)

## Adding a New Source

1. Create `sources/<id>.js` with the `const source` object
2. Create `tests/fixtures/<id>-search.json`, `<id>-detail.json`, `<id>-chapters.json`, `<id>-pages.json` — real API response snapshots
3. Create `tests/<id>.test.js` — copy `tests/mangadex.test.js` and adapt for the new source
4. Add an entry to `index.json` with the GitHub Pages URL: `https://manganohonbako.github.io/honbako-sources/sources/<id>.js`
5. Bump `version` in both `sources/<id>.js` and `index.json` on every subsequent change
6. Run `npm test && npm run lint` — both must pass before opening a PR

## Tests

Tests use Node's `vm` module to load source files in an isolated context, mirroring how JSCore isolates them at runtime. Each test file:
1. Loads the source via `loadSource('name')`
2. Checks shape (metadata fields + all 8 methods present)
3. Tests each request builder's URL output
4. Tests each parser against a fixture file

No network calls in tests — fixtures are committed snapshots of real API responses.
