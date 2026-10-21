# V16 — input compatibility and English game menus

The release audits all 71 checksum-pinned game runtimes. It adapts native Pointer Lock calls in 21 games; four other games contain dormant engine/library support. `npm run build` regenerates the audit at `public/game-audit.json` and fails if any native input call in the adapted games escapes the adapter.

`public/game-input.js` never emulates a browser lock, changes browser prototypes or grants permission. It handles unavailable APIs, synchronous failures, Promise rejections, legacy void returns, real lock-change events, duplicate pending requests and safe release. A dismissible message explains missing support or lets the player retry with a new click. Games keep their own keyboard/gamepad/drag/touch fallback. This does not add touch controls to desktop-only games. Operation Ironhold keeps the V15 mobile input repair.

Stardust Isles uses its existing English locale by default, respecting an explicitly saved language choice. Glimmer Box selects its supplied English locale once and respects later picker changes. MineWorld, Mastermind 3D, Niulai Arena, Skyline Rush, Stardust Drifter, Crossroad, Rubik's Cube and Hypeometry receive English UI strings. Desire Path's browser warning is translated. Voxel Musou uses its original English bilingual fields and English menus, with some historical narrative and decorative calligraphy remaining Chinese. Game-page language notes disclose this limitation.

Patches are applied to fresh, checksum-verified archives at each build. Original archive hashes, creator credits, licenses, asset files and game save keys are retained. Native calls are rewritten using the Acorn AST, keeping application methods with the same name intact. Translation keys are scoped to each game; English strings, shader whitespace, storage keys and identifiers are not globally replaced. Module URLs and launch URLs include release 16 so existing visitors fetch patched code without deleting saved data.

Validation: Node regression tests cover absent support, denied permission, old/new API return behavior, real lock confirmation, duplicate requests and retries, transform boundaries, English bilingual arrays, shader preservation and existing admin/backup/mobile behavior. Full-library build, static input audit, HTML/GLB dependency verification and all 142 bilingual game pages are checked. Browser checks cover rendered menus and launch routes. Cloud browser graphics limitations do not establish iPhone or physical-device gameplay performance.

Reproduce:

```sh
npm ci
node --test tests/*.test.mjs
npm run build
python3 scripts/verify-library.py
python3 scripts/verify-pages.py
```

Deployment uses the existing Vercel project and source branch `library/self-hosted-v8`; the original `main` history and server-side admin configuration remain unchanged.
