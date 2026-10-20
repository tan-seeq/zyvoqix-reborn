# ZYVOQIX V13

The library expands from 50 to 71 independently sourced games and experiences. Jungle Trail is an exploration experience; Hypeometry offers three perspective puzzle levels. Neither is represented as multiple separate games.

Each catalog entry has English and Arabic game pages with controls, device requirements, approximate runtime size, credits, related games and a player that loads only after Start. Category pages, language alternates, canonical URLs, social metadata, structured game data, a sitemap and robots rules support discovery. This does not guarantee search rankings or traffic.

The library adds featured, newest, alphabetical and smallest-download sorting; puzzle and arcade categories; and a recently played list stored in this browser. Existing favorites, profiles, comments, tier lists and original arcade data retain their storage contracts. Shared accounts and global rankings are not enabled by this release.

New games are pinned to exact source revisions. Complete runtime archives and preferred source are retained in `vendor/`. Third-party license texts are consolidated without removing their contents. CrossRoad records real scores locally, replacing its original external database. CubeRun uses system fonts in place of restricted display fonts; its React gameplay and Mortar Command are bundled using esbuild in place of obsolete build tooling.

## Build and verification

Run `npm run build`, then `python3 scripts/verify-library.py` and `python3 scripts/verify-pages.py`. Browser checks should cover searching, sorting, favorites, language persistence, game links, launch/error handling and the preserved gamer hub. Orbit Golf's 275 original tests and its TypeScript check passed during preparation.

The cloud test browser does not expose WebGL graphics. These checks do not establish frame rate or actual gameplay compatibility on iPhone, Android or desktop GPUs. Device testing remains necessary before a broad promotional launch.

## Domain and hosting

`site.config.json` defines the public origin used for generated canonical links, language alternates and the sitemap. Update it only after the chosen domain is owned, connected and verified. Existing hub-page canonical links should be updated at that time too.

Changing the origin does not migrate browser storage. Export profile and hub data, inspect individual games' save/export options, and plan data transfer before enabling an automatic redirect from the old address. This release keeps the current Vercel project and origin.

A custom domain can use the existing hosting. Before commercial operation, select a hosting plan that permits it and review data-transfer usage. Domain purchase, a paid plan change, external accounts and advertising are outside this release.
