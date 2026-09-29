# Resort listing and detail template

Scope: the resort directory and main resort detail routes. Homepage layout is unchanged. Shared header/footer behavior changes only on resort detail routes. Safety now receives the existing emergency-contact records; no FAQ or emergency records were deleted.

One ResortDetails template covers Bakuriani, Gudauri/Kobi (existing URL preserved), Mestia and Goderdzi. Resort symbols/colors remain the supplied artwork. A per-language uploaded logo replaces the symbol/name lockup in page content when available. The global MTA header logo and global footer remain unchanged. The header is transparent over the hero and gains a blurred background after scrolling.

Order: video/image hero → three CTAs → stats → about/history/facts and illustrated journey map → compact lifts/trails and interactive map → icon-list activities → compact resort-filtered events → Today in the resort → preserved purchase block → PDF/social links → Meet us at the resort (gallery) → global footer.

Today reuses the homepage ResortCard, existing live-conditions adapter/proxy and minute polling. No operational numbers are invented. Unavailable/stale observations are labelled; placeholders use dashes. Closed-zone records remain in the interactive map. Events use existing event data filtered by area (including the Gudauri/Kobi aliases), excluding all-resort records.

Admin → Resorts → edit → Resort page provides bilingual editorial fields, logo/banner/poster upload, MP4 and optional WebM upload or URL, lift duration/type/hours, trails with easy/medium/difficult enums, activities with icon keys, PDF upload, social links and journey information. Existing stat fields remain in the characteristics panel. List order controls rendering order. Each language can have different media and copy.

The optional page object is stored in existing KaJson/EnJson JSONB. ResortPageContent validates this contract on writes. Older clients omitting page do not erase it. Migration 20260928120000_ResortPageContent adds the supplied social URLs, empty media/copy placeholders and illustrative marker positions without replacing existing content. Its downgrade deliberately retains editorial data.

Still awaiting editorial inputs: dedicated resort logo files, final copy, verified city driving times, individual trail lengths and PDF maps. Until supplied through Admin, the supplied resort symbol/name lockup and explicit content placeholders are used. The Georgia illustration now uses the public-domain Natural Earth country boundary; resort markers remain editorial illustration points rather than navigation coordinates. Existing transport text remains visible until replaced. TikTok is unlinked until configured.

PDF/video uploads: authenticated Admin/Moderator + CSRF, 5 MB per file, file signature checks, generated filenames, nosniff. PDFs have attachment disposition; videos support byte-range streaming. The four supplied videos are H.264 and have been losslessly remuxed for fast-start playback; originals in Downloads are untouched. Posters are extracted from those videos. Migration 20260928140000_ResortHeroMedia fills only empty media fields and preserves custom references.

Media files live in `mtaprime/public/videos/`: `bakuriani.mp4`, `gudauri.mp4`, `mestia.mp4`, `goderdzi.mp4`. Their public URLs are `/videos/<name>.mp4`. Matching posters use `<name>-poster.jpg`. Optional `<name>.webm` files go in the same directory; set `/videos/<name>.webm` in the optional WebM field in Admin for each language. WebM is tried first, MP4 is the fallback. Admin uploads are stored separately under `/media/` and replace the configured reference.

Desktop hero video uses autoplay, muted, loop, playsInline, preload metadata and cover sizing, with an accessible pause button. At widths below 768px, reduced-motion, or navigator.connection.saveData, no video/source element is mounted, so only the poster loads. Video pauses out of view and in hidden tabs. Below-fold images are lazy loaded.

Motion: IntersectionObserver triggers one-time fades/slide-ups and staggered lists; stats count up once; desktop hero has subtle transform-only parallax; a resort-color progress bar uses requestAnimationFrame. No pinning or scroll interception. Mobile has smaller movements, no parallax; reduced-motion uses brief opacity reveals and static stats. Header background appears through opacity. No animation package was added.

Verification:
- npm run build in mta.admin
- MTA_BUILD_DIR=.next-resort-verify npm run build in mtaprime (PowerShell: set the environment variable separately). This avoids OneDrive locks in the default output folder.
- dotnet build mta.api/Mta.Api.csproj --configuration Release
- node scripts/check-resort-template.mjs (creates and removes its temporary local resort, PDF and video; tests bilingual persistence, validation, CSRF, migration values, video byte ranges and legacy-client preservation)
- Existing FAQ records remain managed independently; resort pages no longer fetch/render them.

Deployment: apply the migration using the normal database configuration, deploy the API and both frontend builds. When using a custom build directory, use the same MTA_BUILD_DIR for next start. Local migration is not production deployment.
