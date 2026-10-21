# V17 navigation repair

The profile previously used a separate arcade header. Its Home and Play buttons switched to an older 26-game interface, making the newer 71-game library seem to disappear.

A shared header renderer now supplies the library, game/category pages, rankings, tier lists, comments, missions, player profile and Game stores. Home and Games point to the canonical English or Arabic library. The same destinations and responsive menu appear across these page families.

Old arcade `#home` and `#play` bookmarks redirect to the canonical library. A plain arcade URL opens the player profile. Original score-linked games and `#game-…` URLs retain their saved identifiers; `#classic` is the explicit classic-game view. Hub sections use browser history correctly. No storage keys, profiles, saves, game catalogs, game runtimes, authentication or backup formats are changed.

Validation: 44 behavior/security/regression tests, all 71 runtime bundles, 142 bilingual game pages, and browser round trips between library/profile/hubs/game pages in both languages, including Back/Forward and narrow-screen navigation.
