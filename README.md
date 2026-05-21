# honbako-sources

Official source extensions for [Honbako](https://github.com/manganohonbako/honbako), a native iOS/iPadOS manga reader.

## Add this repo to Honbako

In the app: **Settings → Repositories → Add** and paste:

```
https://manganohonbako.github.io/honbako-sources/index.json
```

## Sources

| Source | Languages | NSFW |
|--------|-----------|------|
| MangaDex | en | No |

## Contributing a new source

1. Copy `sources/mangadex.js` as a starting point
2. Implement all 8 interface methods (see [CLAUDE.md](CLAUDE.md))
3. Create fixture files in `tests/fixtures/` and a test file in `tests/`
4. Add an entry to `index.json`
5. Run `npm test && npm run lint` — both must pass
6. Open a pull request

## Local development

```bash
npm install
npm test       # run tests
npm run lint   # check for lint errors
```
