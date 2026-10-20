# V15 — protected owner dashboard and Ironhold touch input

The backup page now lives at `/super-admin/backup/` and `/ar/super-admin/backup/`, behind a server-checked owner session. Legacy `/data/` URLs redirect there. Sign in at `/admin/login/` or `/ar/admin/login/`.

## Owner authentication
- `iron-session` 9.0.1 issues sealed `__Host-zyvoqix_admin` cookies: HttpOnly, Secure, SameSite=Strict, root path, four-hour maximum. The server checks role, owner, expiry and credential version for every private request.
- Configure `ZYVOQIX_ADMIN_ACCOUNT` with an email, a random 16-byte hex salt and a 64-byte hex scrypt digest (N=32768, r=8, p=1, maxmem=64 MiB). Configure `ZYVOQIX_ADMIN_SESSION_SECRET` with at least 48 random characters. Store both as Vercel secrets, with distinct production and preview values. No credentials belong in source or public assets.
- Origin checks and JSON-only POST requests cover sign in; logout also requires a per-session CSRF token. Login work is bounded and throttled in each warm function instance. **This backstop is not a distributed rate limiter**; no shared limiter or database is provisioned.
- Logging out clears the current browser cookie. Sessions are stateless; a copied cookie remains valid until its four-hour expiry. Rotating the session secret or changing the account digest invalidates older cookies.
- Admin responses use no-store, noindex, a restrictive CSP and frame-ancestors none. The service worker excludes admin, backup and API paths, respects private/no-store responses, and is updated before sign-in/private tools are used.

## Dashboard
The authenticated dashboard offers catalog search, desktop/touch filters, game links, deployment/library metadata checks and JSON exports of the catalog and status report. It does not edit live game files or collect visitor records.

## Backups and preservation
The existing allowlisted browser backup format and default keep-existing restore behavior are preserved. The tool checks the session before export, review and import. It backs up supported localStorage records in the current browser only, not visitor devices, all server data, IndexedDB worlds or cloud accounts. Existing arcade/profile exports remain available for their owners. Nothing clears or migrates player saves.

## Operation Ironhold mobile repair
An iPhone screenshot showed `document.body.requestPointerLock is not a function` on start. The build now applies `scripts/ironhold-mobile.mjs` to the unchanged, checksum-pinned MIT upstream archive. Touch input bypasses Pointer Lock and supplies a movement pad, drag-to-aim area, fire/reload/jump/aim/weapon/run/crouch/pause controls. Losing focus releases held input and pauses the round. Coarse-pointer resolution is capped at DPR 1. Desktop Pointer Lock remains intact; unsupported/throwing requests pause instead of crashing.

The patched runtime, dependencies and original MIT license are available at `/sources/operation-ironhold-mobile.tar.gz`. A visible startup failure inside the site's player is reported once by the parent rather than drawing duplicate overlays.

## Validation
25 Node tests cover server authorization, invalid/tampered sessions, cookie attributes, CSRF/origin failures, backup preservation/rollback, board filters and touch state/Pointer Lock regression. Build verification checks all 71 pinned runtimes and 142 localized game pages. A cloud browser without a GPU cannot certify FPS or real iPhone gameplay; actual device play remains a separate check.

Game launch and direct links use `zyvoqixRelease=15`; entry HTML revalidates instead of remaining fresh in the browser for an hour. Heavy runtime assets keep their existing cache policy. This avoids serving the pre-fix Ironhold entry from an iPhone cache.
