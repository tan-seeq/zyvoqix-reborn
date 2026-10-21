# V17 — Daylight visual theme

The live website uses a light palette drawn from the original transparent ZYVOQIX logo: ice-blue and lavender backgrounds, white cards, blue/violet actions, pink favorites and gold ranking highlights. The shared `public/theme.css` loads after existing page styles, preserving layout, English/Arabic navigation and page behavior.

The theme covers the library, all generated game/category/about pages, rankings, tier lists, comments, missions, existing player profiles, sign-in, protected administration/backup pages and 404. The historical `/legacy/` archive retains its original interface; its site ownership footer is updated. Game documents, canvases, source archives, game catalogs, saves, account authentication and backup behavior are unchanged. Existing V16 input/language repairs remain active.

HTML theme-color and PWA startup colors use the light palette. A new service-worker shell cache includes the theme stylesheet; activating it removes only old site caches and never clears browser storage. Game runtime release URLs remain V16 because this release changes the surrounding site, not game code.

Validation includes the existing regression suite, full 71-game build, static dependency checks, 142 bilingual game pages, primary color contrast, and live browser inspection of both languages and page families. Phone layout is checked using a narrow preview viewport; this does not certify physical-device GPU gameplay.

All current site footers identify `© 2026 ZYVOQIX · Yahia Hatem Abdullah. All rights reserved.` in English in both locales. Public header/footer links to the project repository, Super Admin, About & saved data and Earlier archive are removed. Protected administration remains available by direct URL. Individual game creator credits, source links and license notices remain available.

Game stores in `/arcade/index.html#discover` now has a light hero, eight provider cards, nineteen existing external links, combined provider/category/text filters, reset controls, accessible favorites and explicit new-tab labels. It is linked from current public navigation. The directory metadata and filter helper have three behavioral tests. These entries remain external provider links; the 71 self-hosted games are unchanged.
