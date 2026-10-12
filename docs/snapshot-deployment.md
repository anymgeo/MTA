# Temporary public-only releases

The existing Vercel project `mta` serves `mta-five.vercel.app`. Admin and the .NET API stay local. Only anonymous published CMS responses and their referenced media are exported; source images are copied unchanged.

1. Start the local CMS API on port 5100 and publish the desired content in the local admin.
2. From the repository root, run `node scripts/export-public-snapshot.mjs`.
3. In `mtaprime`, set `PUBLIC_CONTENT_MODE=snapshot` and build with `node node_modules/next/dist/bin/next build`. Use `MTA_BUILD_DIR=.next-snapshot` to isolate local verification output, then start on port 3102.
4. From the root, run `node scripts/check-public-snapshot.mjs`, `node scripts/check-cms-pages.mjs` and `node scripts/check-resort-section-order.mjs` with `TEST_SITE_ORIGIN=http://127.0.0.1:3102`. Check desktop/mobile UI in both languages.
5. Deploy from the linked repository root to the **existing** project with `vercel deploy --prod --skip-domain --yes --scope gabbbelaia-5847 --project prj_ZFbXuRjYH6QEe3QQL5IPLP3IbtER -b PUBLIC_CONTENT_MODE=snapshot -e PUBLIC_CONTENT_MODE=snapshot`. Verify the staged deployment before `vercel promote <deployment-url> --scope gabbbelaia-5847`.

On this Windows machine use `NODE_OPTIONS=--use-system-ca` for Vercel CLI TLS verification. Do not disable certificate validation.

Repeat the export/build/QA/deploy sequence for each of the planned 4–5 releases. Local admin edits do **not** immediately update this public snapshot. Contact submission returns 503 and visibly directs visitors to email/phone. Live conditions show unavailable rather than freezing observations as current data. Gallery watermarking remains a public Next.js download handler; it does not expose the CMS API or admin.

For the eventual own-server deployment, configure the real protected CMS API and remove `PUBLIC_CONTENT_MODE=snapshot`. Normal local API-backed development is unchanged. Existing Vercel secrets and domains are not replaced by this release workflow.
