# V17 — Daylight visual theme

The live website uses a light palette drawn from the original transparent ZYVOQIX logo: ice-blue and lavender backgrounds, white cards, blue/violet actions, pink favorites and gold ranking highlights. The shared `public/theme.css` loads after existing page styles, preserving layout, English/Arabic navigation and page behavior.

The theme covers the library, all generated game/category/about pages, rankings, tier lists, comments, missions, existing player profiles, sign-in, protected administration/backup pages and 404. The historical `/legacy/` archive is unchanged. Game documents, canvases, source archives, catalogs, saves, account authentication and backup behavior are unchanged. Existing V16 input/language repairs remain active.

HTML theme-color and PWA startup colors use the light palette. A new service-worker shell cache includes the theme stylesheet; activating it removes only old site caches and never clears browser storage. Game runtime release URLs remain V16 because this release changes the surrounding site, not game code.

Validation includes the existing regression suite, full 71-game build, static dependency checks, 142 bilingual game pages, primary color contrast, and live browser inspection of both languages and page families. Phone layout is checked using a narrow preview viewport; this does not certify physical-device GPU gameplay.
