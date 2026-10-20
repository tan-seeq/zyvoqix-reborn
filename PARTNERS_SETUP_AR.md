# ZYVOQIX — Playgama Partner Integration V8.2

## Status
- GameDistribution application was declined because traffic was below their onboarding threshold.
- **Playgama integration code is ready, not activated**. We have not yet received your Playgama Partners CLID or approved catalog export. No Playgama games are currently claimed to be live.
- Existing 240 games remain. GamePix is an optional second provider, requiring publisher account/approved catalog and embed conditions.
- Hosting: Render static site with GitHub main automatic deploy.

## Step 1 — Register and get your CLID
1. Sign in at https://widgets.playgama.com/ and accept Partner Terms.
2. Open the catalog, filter by racing, action, shooter, flight and adventure.
3. Download the entire catalog as **JSON**, or a curated selection. The signed gameURL should carry your CLID, or note the public CLID and pass it to the import script.

Source: https://wiki.playgama.com/playgama/for-partners/import-the-game-catalog

## Step 2 — Import once you have the approved partner JSON

Save the downloaded JSON locally as `playgama-export.json` (not committed to GitHub). Use Node.js 22+:

```bash
node scripts/import-playgama.mjs playgama-export.json --clid=YOUR_PUBLIC_CLID
node scripts/import-playgama.mjs playgama-export.json --clid=YOUR_PUBLIC_CLID --write
node scripts/validate-library.mjs
```

When the JSON already has signed gameURL values with CLID, the `--clid` argument is optional. The first command performs a dry-run. The second updates only entries from Playgama and preserves the existing catalog. Commit `public/library.json` to GitHub, which triggers Render automatic deployment.

**Never paste passwords or private API tokens in code or here**. CLID is a public partner identifier embedded in game URLs. Partner-only catalog exports may contain rights-restricted information; do not commit the export unless your agreement authorizes publishing that metadata.

## What has been implemented
- Playgama URLs only supported under `https://playgama.com/export/game/<slug>?clid=...`.
- Partner metadata is normalized to the site's existing categories and stored in `public/library.json`.
- HTTPS cover-image URLs are rendered as thumbnails when supplied by the authorized export.
- Games open in `/play.html?id=...` as publisher-hosted iframes, with explicit external fallback.
- Duplicate games are removed by slug/URL; invalid/unsigned partner entries are rejected.
- `scripts/validate-library.mjs` and GitHub Actions syntax/catalog checks.
- `public/portal-config.json`: optional GA4 Measurement ID. Blank by default; GA4 loads only if visitor opts in. No GA4 visitor counts exist until configured. Official Playgama dashboard offers gameplays and revenue after activation.
- `public/privacy.html` explains favorites storage and external iframe behavior.

## GamePix
GamePix also provides publisher embedding via an authorized partner account: https://partners.gamepix.com/publishers . Their **Game Developer SDK** is not the same as the **publisher game feed**. Do not insert it into ZYVOQIX until you have publisher onboarding and the approved URLs/feed.

## Verification
```bash
node --check public/portal.js
node --check public/telemetry.js
node --check scripts/import-playgama.mjs
node scripts/validate-library.mjs
node scripts/import-playgama.mjs scripts/fixtures/sample-playgama.json --clid=DEMO321
```

After actual import, test at least a few partner titles in Chrome/mobile for iframe, orientation, sound, ads, payment, and fallback. Existing 142 community embeds are separate and have **not all been tested in real browsers**.

This does **not** mean copying any games into GitHub. GitHub contains metadata and frontend; game binaries stay with licensors.
