# ZYVOQIX REBORN — V8.1 Game Library

**Live site:** https://zyvoqix-reborn.onrender.com/

This repository is the authoritative source of the ZYVOQIX gaming portal. Render automatically deploys commits to `main`.

## What is included

- **240 catalog entries** in `public/library.json` (data, not 240 locally hosted game executables).
- 45 hand-curated game links to original browser gaming portals.
- 53 individually indexed links to Yandex Games pages.
- 142 community game references from the [sausi-7/games](https://github.com/sausi-7/games) MIT project, displayed in a local player iframe. Iframe compatibility and individual game availability must be checked in a real browser.
- Arabic-first responsive homepage, category/source filters, favorites saved in localStorage, external navigation and player page.

## Technical architecture

Render Static Site → `staticPublishPath: ./public`

```
public/
  index.html          Homepage
  portal.css          Visual design
  portal.js           Search, filters, favorites, catalog display
  library.json        All 240 game metadata records
  play.html           Community-game iframe wrapper
  assets/             ZYVOQIX brand artwork
  icons/              PWA icons
  sw.js               Service worker
render.yaml           Render Blueprint deployment
SOURCES_AND_LICENSES.md
```

## Add more games safely

Append a new entry to `public/library.json`, ensuring unique `id` and `url` fields:

```json
{
  "id": "my-game-id",
  "name": "My Game",
  "cat": "cars",
  "desc": "Game description",
  "url": "https://publisher.example/play",
  "host": "Original publisher",
  "mode": "external",
  "source": "curated",
  "cover": ""
}
```

Supported categories: `war`, `cars`, `air`, `multiplayer`, `action`, `adventure`, `horror`, `puzzle`.

`mode: external` sends visitors to the original source. **Do not set `mode: embed` unless the publisher grants iframe / distribution permission** and the player is configured to allow that exact source. The community player currently only trusts `sausi-7.github.io/games/games/` URLs.

## Copyright and important limitations

Free games do not automatically give us redistribution rights. We do **not** download or mirror Yandex Games, CrazyGames or Poki executables/screenshots. Yandex listings are outbound links only. Attribution is listed in `SOURCES_AND_LICENSES.md`.

This is **not the complete Yandex Games platform**. It is the initial 240-entry searchable catalog and can grow through verified submissions and approved distributor partnerships.

## QA and deployment

Verify the home page loads the catalog, filters update results, outbound links open originals, local favorites persist and embedded community games render. Render deployment and per-game browser checks are separate from a successful GitHub commit.
