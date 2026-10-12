# Legacy CMS migration and public release — 2026-10-06

## Scope

The existing Vercel project `mta` and domain `mta-five.vercel.app` receive only the public Next.js application. By explicit user choice, the .NET API, PostgreSQL and Admin remain local. The release contains an exported anonymous published CMS snapshot and referenced media, not a hosted CMS connection. Subsequent local edits require another export/release.

## Imported content

- 53 original News records and all 6 Projects from the legacy MTA site, into the existing authenticated CMS endpoints.
- 52 available English counterparts (46 News and 6 Projects). Seven News sources had no English counterpart; the original Georgian is retained with an English availability notice.
- Original publication days preserved. Projects preserve their original year/year range without inventing a full publication date.
- 85 unique source media URLs migrated into local managed storage. The public export includes 101 media assets, verified by SHA-256.
- Existing project URLs preserved. Five duplicate records created during this import were merged into existing entries and soft-deleted; originals/backups and audit history remain recoverable in `.local/legacy-migration`.
- No new database schema migration was needed for this import. The API validation accepts year-only project records explicitly marked with `datePrecision: year`.

## Repeatable workflow

1. Inspect/download source content: `node scripts/inspect-legacy-content.mjs`.
2. Load available English sources: `node scripts/inspect-legacy-content.mjs --translations`.
3. Preview the plan: `node scripts/import-legacy-content.mjs`.
4. Apply through the local authenticated CMS: `node scripts/import-legacy-content.mjs --apply`.
5. Verify CMS/API: `node scripts/verify-legacy-content.mjs`.
6. Export published data/media: `node scripts/export-public-snapshot.mjs`.
7. Follow `docs/snapshot-deployment.md` for build, QA, staged production deployment and promotion.

Credentials, backups, raw source documents and import manifests stay in ignored `.local`; never upload them. Latest importer rerun: 59 unchanged records, no new duplicates.

## UI changes

Shared RFID-style Ski Pass SVG; clean resort-name headings and editorial introduction typography; safe formatted legacy News/Project bodies; plain card summaries; subtle white transparent gallery watermark at bottom-left (~5% width, 80% opacity), including downloads with the approved attribution. Existing galleries, map geometry, CMS style and auth remain intact.

## QA

- Public production build: 179 generated pages; Admin production build and .NET API build succeeded.
- 132 public routes plus 118 migrated bilingual detail routes passed HTTP/content checks.
- Complete Georgian source text, dates/year metadata, distinct source identities, 85 migrated media URLs, protected anonymous Admin access checked.
- All 101 exported media hashes and four watermarked downloads passed; clean originals remain unchanged.
- Browser checks: homepage, News list/detail, Projects list/detail, Today page, all four resorts, language/season controls, gallery navigation and logo-home navigation. No console errors or broken loaded images in these checks.
- Local Admin sign-in, migrated News search/editor and Gudauri map editor checked without saving test edits.
- Gudauri supplied clean PNG hash exactly matches `/maps/gudauri-clean.png`, reference 1183×1330. Desktop, 768×1024 tablet and 390×844 mobile checked; zoom, pan, reset, fullscreen and shared image/geometry transform work; no horizontal overflow. The existing two-point feature opens in Admin and vertex deletion is disabled at the minimum.
- Public map remains read-only. Full official trail/lift tracing has **not** been verified: the current Gudauri overlay is an existing test feature, not a complete official trail network. An annotated reference matching the supplied clean terrain is still required for accurate tracing.

## Intentional snapshot limitations

No production API/Admin was deployed or claimed as verified. Live conditions remain unavailable without a verified feed. Contact submission remains disabled with email/phone fallback. Existing local CMS and production environment/domain settings are preserved.

## Deployment

Production deployment `dpl_H1RZHfmouLqmTRV8M5Aa6wsT9JLv` built successfully on the existing project and was promoted to `https://mta-five.vercel.app`. Vercel inspect resolves this domain to the new deployment. The staged deployment was checked through the authenticated browser; anonymous stage requests encounter Vercel authentication, which was not disabled. Main-domain anonymous map/conditions endpoints return JSON successfully and the Gudauri image/reference dimensions/features match the exported CMS exactly. Runtime error-log query returned no entries.

Post-promotion checks passed on the actual main domain: 132 Georgian/English public routes, all migrated News detail URLs, eight resort section-order checks, all 101 exported source-media hashes, four watermarked downloads and both responsive image-optimizer sizes. Browser console checks were clean. Visual proof: ignored `.local/gudauri-production-qa.jpg`.

Incremental CocoIndex refresh was attempted but did not finish; it was stopped. Current source files, rather than the derived cache, were used for verification.
