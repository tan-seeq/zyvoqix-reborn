# ZYVOQIX V14

This release keeps all 71 existing game archives and their pinned source revisions. It adds English and Arabic player-data pages at `/data/` and `/ar/data/`, giving 164 sitemap routes and retaining 142 localized game pages.

The backup tool exports explicitly supported localStorage records: favorites, recent games, arcade player profiles and saves, hub boards/lists/comments/XP, namespaced game saves and documented legacy game keys. It excludes unrelated origin data, cookies and IndexedDB worlds. It accepts the new `ZYVOQIX_SITE_BACKUP` format and older hub backups. Older single-player arcade exports still use the original profile importer.

Import validates keys, data types and duplicate records before producing a review. Its default adds missing records and keeps existing values. An explicit replacement option requests a current backup download before replacing records. Writes check the reviewed original value, roll back on errors and avoid overwriting a concurrent change during rollback. Browser downloads are requested, not guaranteed saved: the user should keep and check the downloaded file.

Tier lists now have a separate game filter and search, leaving the saved-list category as metadata. Filtering never changes saved board contents. New users start with the actual hosted catalog unranked; existing saved boards and older external/custom game names remain available.

Navigation has a collapsible phone menu. The standalone player has a direct same-site runtime link and fullscreen with a CSS expanded-view fallback. Expanded stages use dynamic viewport height and safe-area padding. Terminal loading errors stop the slow-load timer. The library uses the generated embedded catalog without a redundant fetch that could replace cards during an initial click.

Validation: built-in Node tests cover raw-data round trips, unsupported/duplicate records, invalid core values, default preservation, explicit replacement, storage-failure rollback, stale previews, old hub backups, hosted/custom filters and Arabic search normalization. Browser checks cover the user-facing import review, favorites, tier filtering, language and player navigation. The cloud browser lacks a WebGL GPU and does not establish real iPhone/Android gameplay compatibility or performance.

No production user data is migrated or cleared. The original arcade app, game engines, error bridge, catalog, API and game archives remain unchanged. Shared accounts and global rankings are not enabled by this release.
