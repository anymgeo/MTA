# Public navigation, news and resort polish — 2026-10-06

News now accepts only `news` and `blog`. Migration `20261006120000_TwoNewsCategories` converts legacy Article records to Blog without deleting content, records an audit entry and rotates their concurrency version. Blue News and green Blog labels are shared by the list, filter and detail page in Georgian and English.

`/[locale]/today` displays all four live-condition cards, regardless of homepage visibility. Existing CMS `/#live` navigation links are adapted to `/today` without replacing unrelated CMS links. Missing observations remain unavailable; no operational readings are fabricated.

Resort section order is Hero, About, Lifts and Trails, Activities, Interactive map, Events, Gallery, Meet. About uses the existing safe rich-text renderer and admin Markdown toolbar; an optional validated `informationUrl` is stored in the existing bilingual page JSON. The existing original map, gallery filters, lightbox keyboard/touch handlers, clean source uploads and download-watermark endpoint remain intact. Carousel photos use responsive sizes and lazy optimization.

## Local verification completed

- Public production build and ESLint; admin production build/TypeScript and changed-component ESLint; API build (zero warnings/errors); category migration applied locally.
- `check-news`, `check-roles`, `check-content-cms`, `check-cms-reflection`, `check-map-editor`, `check-faqs`, `check-resorts`, `check-live-cards`, `check-resort-template`, `check-resort-section-order`, `check-resort-gallery` and managed-map unit test passed.
- Browser checks at 1440 × 900 and 390 × 844: Georgian/English homepage, all four resort routes, Today, News list and five published detail pages. Checked headings, no horizontal overflow, homepage logo destinations, category filters, desktop/mobile lightbox arrows, Escape close, category filtering, carousel controls, route-preserving language switch and winter/summer theme tokens. The mobile viewport check is not a physical-device touch test.
- Authenticated admin: only News/Blog dropdown choices, existing gallery metadata, bilingual About rich-text toolbar and optional-link accordion. Backend role tests cover Admin/Moderator restrictions, CSRF, audit and concurrency.

## Earlier API-backed release gate (superseded by public-only snapshot below)

### Authenticated production attempt — 2026-10-06

CLI authentication succeeded as `gabbbelaia-5847` and the checkout was linked to the existing `mta` project (root directory `mtaprime`). A deployment-only `.vercelignore` excludes local caches, dependencies, secrets and the separately hosted API/admin from public-site uploads. Production environment values were not changed.

Staged production deployment `dpl_BrXBPPTK1K5nNRG4P8AG5SWMNxYM` compiled successfully, then failed during page-data collection: `API_BASE_URL must be configured for the content CMS.` Vercel lists the production key, but the build receives no usable value. Sensitive values cannot be downloaded for inspection. The production API host and migration access remain unknown. The deployment used `--prod --skip-domain`; it was not promoted, and `mta-five.vercel.app` remains on its previous working deployment. Supply/confirm the deployed ASP.NET CMS API origin before retrying; never substitute the local API or a fixture fallback.

Earlier, before successful CLI authentication: Vercel project `mta` / `prj_ZFbXuRjYH6QEe3QQL5IPLP3IbtER` was confirmed associated with `mta-five.vercel.app`. Existing branch preview `dpl_DA7cpktBC1gxcy7E54dxKmUv2DRX` had an ERROR build state. Connector log reads returned 403 and no push or deployment had yet been attempted. The authenticated attempt above supersedes that access blocker; production CMS configuration still blocks release.

Before release: restore the Vercel connection for that scope, confirm the production API/admin hosting and database migration access, apply the migration to the production API/database, then push/deploy the verified public and admin builds and re-run production checks. Local migrations and local gallery files are not production deployment. Live feeds and missing PDF assets must be supplied through their existing integrations/CMS, not invented.

The optional CocoIndex incremental refresh was attempted but did not finish in the bounded wait; direct file searches and builds remain the source of truth.

## Public-only snapshot release — 2026-10-06

The user approved keeping API/admin local for the temporary 4–5 release cycle. Exported 63 anonymous published responses and 15 byte-identical referenced media assets, including 12 Bakuriani gallery photos. No admin/API application or local secrets were uploaded. Existing production secrets were preserved; this deployment sets `PUBLIC_CONTENT_MODE=snapshot` at build/runtime.

Local production build passed. Verified 132 bilingual public routes, eight resort section-order checks, managed-map unit test, all four watermark downloads with unchanged originals, asset SHA-256 hashes and 640/1920-width Next image optimization. Checked 36 affected views at desktop/mobile sizes locally and again on the staged Vercel deployment; gallery filter/lightbox navigation and season toggle passed. Downloaded all four resort watermark images from Vercel; visually confirmed Bakuriani logo and bilingual caption. No browser console errors on the inspected production Today page.

Vercel deployment `dpl_CfHDCrwX1D548NyuuV4E4SwbPKAW` built successfully and was promoted only after staged QA. `https://mta-five.vercel.app/ka/today` now serves the dedicated four-resort page. New public data comes from the exported snapshot; future local CMS edits require re-export and deployment. Contact submission is visibly unavailable; live observations are deliberately unavailable instead of fabricated or frozen. See `snapshot-deployment.md` for the repeatable workflow. No Git push was performed for this CLI release.

The optional incremental CocoIndex refresh was attempted again but did not return within the bounded wait; no full rebuild was requested.
