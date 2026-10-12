# Infrastructure release — 12 October 2026

Production: https://mta-five.vercel.app

Existing Vercel project `mta`, deployment `dpl_EQgoez8QKiEk9ugkuz2Wcww6eqgr`, staged artifact `mta-azk16l6yi-gabbbelaia-5847.vercel.app`, promoted after QA. Deployed local working source, not a Git integration release. No new project, domain, secrets or production database were created.

## Data and local CMS

The five supplied Excel files were extracted read-only. Authenticated/version-checked CMS updates saved their catalogs in the real local PostgreSQL database. Independent SQL verified:

| Resort | Lifts | Unique trails |
| --- | ---: | ---: |
| Bakuriani | 12 | 26 |
| Gudauri / Kobi | 21 | 36 |
| Goderdzi | 3 | 4 |
| Mestia: Tetnuldi + Hatsvali | 9 | 14 |

Capacity, source lift type, station elevations, minimum/maximum ride times, weekday/weekend winter hours, access lifts, snowmaking, mixed/black classifications, and review notes are retained. Source rows are stored in the authenticated CMS, but raw import audit data and placeholder rows are not exposed by public API responses. Duplicate Sportuli 2 rows were merged using the supplied valid length, preserving both original rows. Unconfirmed lengths and conflicting source notes remain flagged, never silently corrected or invented. Existing map geometry/status data was hash-checked unchanged. Catalog data is not live operations data.

Backup: `.local/infrastructure-backups/mta-before-infrastructure-20261012.dump`, plus timestamped resort JSON backups. No schema migration was needed; existing bilingual resort JSON columns store the extended catalog. API rebuilt and restarted locally from `.local/infrastructure-api-build/Mta.Api.dll`. Admin extended fields are available locally under Resorts → Edit → Lifts & trails. The deployment includes the red Ski Pass CTA previously implemented, using the original icon.

## Verification

API build: zero warnings/errors. Admin TypeScript and production build passed. Public production build passed (179 generated pages). Field-by-field source/snapshot comparisons, catalog counts, duplicates/uncertainties, all eight localized resort section orders, and existing pagination/map unit tests passed. Admin browser verified imported fields and bilingual content. Desktop and 390×844 mobile browser checks identified and fixed grid min-width overflow; all eight localized resort pages then passed without document overflow.

Staged Vercel build passed; browser confirmed catalogs and red CTA before promotion. Main-domain HTTP tests confirmed all eight catalog counts/fields and resort section order; `vercel inspect` resolves the main domain to this deployment. Production snapshot regression confirmed bilingual News/Today pages, all four watermarked downloads, 101 original media hashes, image optimization, and the contact safeguard. Deployment-specific error-log query returned no records. Production screenshot: `.local/qa-infrastructure-production-20261012.jpg`.

API/Admin/PostgreSQL remain local by the user's prior explicit choice. Public Vercel uses an anonymous published-data snapshot; future local CMS edits require another export/deployment. Historical Gudauri map geometry and the still-untransferred Kobi inset are unchanged by this catalog release.
