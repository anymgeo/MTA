# Editorial CMS

## Scope and architecture

The existing ASP.NET API, PostgreSQL database, Next.js admin, and public Next.js site remain in use. News, resorts, FAQ, and the public map renderer were not rebuilt. Existing local map-editor changes remain separate from this CMS implementation.

`ContentRecord` stores the module, stable slug, Georgian/English JSON documents, display order, publication state, soft-deletion flag, creator/editor timestamps and names, and an optimistic concurrency token. `ContentRevision` stores before/after snapshots, actor ID/name, action and time. The new EF migration adds these tables and `ContactMessage`, without deleting existing content.

Admin modules: Leadership, Events, Contact, About, History, Infrastructure, Documents, Safety, Emergency contacts, Webcams, Projects, Structure, Navigation, Homepage links, Footer, Page labels, Messages.

Public editorial collections always read the API with no-store; fixtures are only an import source, not a runtime fallback for these modules. Settings use the stable `settings` slug. Page labels hold translation namespaces; operational/UI translations outside this scope remain ordinary locale files. Existing operational closures/avalanche feeds are separate from the new safety-editorial modules.

## Administration

- Separate Georgian/English tabs; optional copy, lists, links, and history use collapsed accordions.
- Rich copy supports safe Markdown bold, italic, links and line breaks, not executable HTML.
- Structured arrays support add/remove/reorder. Collection ordering is atomic and checks every record's version.
- Admin and Moderator can create/edit/publish/reorder and view audit history. Only Admin can delete records/messages. Record deletion is soft; uploaded media remains recoverable rather than being physically removed while referenced elsewhere.
- Date and time pickers use UTC (Tbilisi is UTC+4), 30-minute time increments, calendar day/month/year dropdowns. Dropdown values are also validated by the API.
- Photos/PDFs/videos reuse the existing authenticated media endpoints and persistent storage. Galleries expose image upload per entry. Use HTTPS webcam embeds, video URLs or image previews; inactive feeds are excluded publicly.
- A changed version returns HTTP 409 and never silently overwrites another editor's save. Existing slugs cannot change, preserving public URLs.

## Contact form

The public contact route validates and proxies to the API; the API stores submissions in PostgreSQL. Messages provides read/unread controls and Admin-only deletion. The form includes required-field/email/length validation, a honeypot and API rate limiting. **No email notifications are implemented**: receipt is through the admin inbox only.

## Initialization and release order

1. Back up the production database and persistent media/data-protection volumes.
2. Deploy the API with its existing `ConnectionStrings__Default` and `StoragePath` configuration. Keep the storage volume persistent.
3. Run the deployed API's `--initialize` command with production environment settings. This applies EF migrations and imports `seed-content.json` once. Existing records, user passwords and edited content are preserved. Missing schema fields/namespaces are supplemented and audited, never overwritten.
4. Verify `/api/content/leadership?locale=en`, all CMS routes and admin login against the production API.
5. Configure the public Vercel project: `API_BASE_URL=https://<api-host>/api`, `API_ORIGIN=https://<api-host>`. The admin project needs `API_ORIGIN` and its existing site-origin settings. Do not use localhost URLs in production.
6. Only then deploy/promote the public site and admin. Verify bilingual content, media, contact receipt and permissions on production.

Production promotion is currently blocked: local Vercel CLI is logged out, the connected Vercel tool cannot access the supplied team/project, and the production API/database target has not been supplied. Pushing this work on a separate branch avoids triggering an unready production rollout from main.

## Verification

- `node scripts/check-content-cms.mjs`: all 16 editorial collections; seed editability, uploads and byte persistence, bilingual publishing/editing, atomic reorder, stale edits/reorder conflicts, history, validation, Moderator no-delete, PDF storage, form API→database→Messages.
- `node scripts/check-cms-reflection.mjs`: saved edits appear in Georgian/English rendered public HTML for editorial modules and settings; original content restored in finally.
- `node scripts/check-cms-pages.mjs`: 132 public routes, both locales, including resort/maps/activity routes, editorial detail pages, global footer presence and server-error checks.
- Existing roles/FAQ/news/resorts/resort-template/live-card/map API regression scripts were run. Old new-record test fixtures now use the already-established category/time dropdown contracts.
- Admin typecheck/lint and both Next production builds pass. Public lint has 24 image-optimization warnings and no errors.
- Browser checks include contact dropdown opacity, real form success→Messages receipt, Leadership editor and representative mobile public/admin layouts. HTTP route coverage is not a claim that every page was visually inspected at every breakpoint.

## Remaining production checks

Confirm the production API/database host and Vercel access; apply the migration there; then complete production click-through, role checks, uploads and contact receipt before promoting. No claim of live deployment is made until this is verified.
