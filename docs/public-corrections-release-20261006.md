# Public corrections release — 6 October 2026

- Existing Vercel project: `mta` (`prj_ZFbXuRjYH6QEe3QQL5IPLP3IbtER`).
- Production domain: https://mta-five.vercel.app
- Deployment: `dpl_3mknD3jD8ij8BfvxjjBDc9QKAo6e`.
- Deployment artifact: `mta-6yq22jfty-gabbbelaia-5847.vercel.app`.
- Public snapshot mode retained; CMS/Admin and .NET API remain local. No production database migration or credential/domain changes.

## Included

Original provided Ski Pass vector icon shared by the CTAs; white transparent vector watermark for display and downloads; News pagination with ten records per page and no News-specific search/filter UI; Gudauri main-panel reference geometry and editable local CMS records. The approved `kom / lom` test feature was soft-deleted, with local backup and normal CMS restore available. It is absent from the public snapshot and production map endpoint.

## Verification

Final local production build and Vercel build succeeded (179 generated pages). Four pagination/map adapter unit tests passed. Local snapshot checks and the same checks against the production domain passed: both languages' News detail pages, Today pages, all four watermarked downloads, 101 original media hashes, responsive image optimization, and all eight localized resort section orders.

Browser checks covered desktop and 390×844 mobile rendering, bilingual homepage/Today/Projects/four resort pages, News pagination and last page, original CTA icon/modal, gallery/lightbox and white watermark, and Gudauri zoom/reset/fullscreen. Production browser confirmed ten News records, original icon, new Gudauri geometry, no test line and no observed console errors. Vercel inspect resolves the production domain to this new deployment; the deployment-specific error-log query returned no records.

## Known limits

Gudauri main-panel geometry was traced from the supplied official reference, with pixel registration against the clean background. Kobi's separate-perspective inset is not transferred; other resorts' existing maps were preserved. Reference map data is not a live operations feed. Some service symbols are grouped and labels still use reference names. Local admin changes require another snapshot release to become public. Live conditions remain unavailable and the contact submission endpoint intentionally returns 503 with alternate contact guidance while the backend remains local.

Production visual proof: `.local/qa-production-gudauri-20261006.jpg` (local-only artifact).
