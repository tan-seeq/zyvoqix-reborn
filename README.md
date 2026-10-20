# ZYVOQIX V8 — self-hosted 3D library

Original Vercel URL: https://gamezone-play-rank-rise.vercel.app/

This first collection contains four independent projects: Space Pirates (interactive combat demo), Kart Royale (kart racer), Dust Corridor (one-map FPS against bots), and Sketchbook (vehicle/flight physics playground). It does not include the Yandex catalog or claim to be a complete commercial game store.

Each vendor archive includes every runtime asset, the preferred code source, upstream revision, original license, and modification notices. Optional original Blender/Photoshop authoring documents are not included. `vendor/UPSTREAMS.json` pins all revisions; source dependency locks are included. Third-party licenses remain with the corresponding project.

## Build

Node.js 24, Python 3 and tar are used by packaging. Ordinary deployment only needs Node.js and tar:

```sh
npm install --ignore-scripts
npm run build
python3 scripts/verify-library.py
```

`npm run build` verifies each archive SHA-256 and extracts its runtime to `public/games/<id>`. Archives are stored in GitHub itself. If a minimal deployment upload omits them, the build fetches the pinned archive commit from this same repository, verifies hashes, and copies assets into the deployment. Game visitors request only Zyvoqix's own host; no remote game provider or CDN is required for play.

The repository's Build self-hosted game library workflow reconstructs and commits the complete packages on `library/self-hosted-v8`. It has write permission only for packaging commits; it does not publish production or change main. The workflow runs only when its packaging source or workflow changes. Assets are loaded only when a visitor opens a game; the PWA does not cache the entire 70 MB library automatically.

## Existing data and rollback

`public/arcade/index.html` preserves the V7 arcade, profile, export/import and the existing `zyvoqix_v6_profiles` storage key. `/legacy/index.html` preserves the earlier arcade. Original Render V6 source is retained in `archive/render-v6/`. The new favorite list uses a separate key, and no localStorage entries are cleared. The original API remains present. Games keep their own original score/save behavior; there is no shared online leaderboard.

Main remains the original Render release until explicitly merged. This branch is independently deployable to the existing Vercel project. Heavy 3D gameplay requires compatible WebGL hardware. The automation browser currently has no WebGL context, so checks in that browser cover navigation, local frames, menus, errors and network delivery rather than GPU rendering or physics quality.
