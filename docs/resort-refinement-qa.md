# Resort and header refinement — 2026-10-06

Local implementation only; no production deployment in this change.

- All four resort About sections now render title and CMS text, without the Georgia outline, travel cards, history disclosure or duplicate facts.
- Bakuriani Georgian/English About updated via authenticated local CMS endpoint. Sources: https://mta.ski/ge and https://mta.ski/en. Other fields preserved; original record backed up in ignored `.local/editorial-backups`.
- Header ski-pass CTA green at rest, shadow-free, subtle hover. Language choices use `ქარ / ENG`, without flags, preserving the current route.
- Map controls use teal, neutral greens and muted plum. Resort identity icons and trail difficulty colors are preserved. Wheel zoom removed; embedded sidebar/list no longer has internal scrolling. Vertical touch scrolling allowed. Explicit zoom/drag/keyboard and fullscreen remain available.
- Subtle scroll reveals, paragraph stagger, existing progress/parallax; reduced-motion preference respected.

## Verification

- Production build succeeds; targeted ESLint succeeds.
- Browser: all four resorts, ka/en, 390×844 and 1440×900; no horizontal overflow or error overlays. Desktop map title remains 22px (fixed parent heading-style collision).
- Real language-toggle click preserves Bakuriani route. Map + button zooms to 135%; wheel scroll changes page Y from 2425 to 3325 without changing zoom. Fullscreen opens; Escape closes it.
- About paragraphs become fully visible after reveal animation; desktop/mobile screenshots reviewed.
- `node scripts/check-resort-refinement.mjs`
- `TEST_SITE_ORIGIN=http://127.0.0.1:3102 node scripts/check-resort-section-order.mjs`: 8 bilingual resort checks pass.
- `node scripts/check-public-snapshot.mjs`: bilingual news/today, four watermarked downloads, unchanged clean image hashes and image optimization pass.
- Public snapshot refreshed from local CMS. Contact submission remains intentionally unavailable in public-snapshot mode; live conditions remain unavailable without a verified feed.
- Incremental CocoIndex refresh did not return; request terminated. Current files, not the derived index, were used for verification.

To run local production preview: set `PUBLIC_CONTENT_MODE=snapshot` and `MTA_BUILD_DIR=.next-refine`, then build and start Next on port 3102. For publication use the existing snapshot deployment procedure; no environment/domain changes are needed for these UI updates.
