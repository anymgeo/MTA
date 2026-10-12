# Resort photo galleries

The resort editor's **Hero & media → Photo gallery** supports 12 photos.
Select multiple JPG/PNG/WebP originals, enter Georgian and English titles and
categories, use the arrow controls to reorder, then **Save**. Categories are
editable tags: entering a new tag creates a filter; update matching tags to
rename it. Removing a photo removes its gallery reference, not its source file.

## Storage and display

`POST /api/admin/gallery-photo` accepts original files up to 45 MB and 64 MP
(16,000 pixels per side). It preserves uploaded bytes in the API's persistent
`StoragePath/media` directory. Admin and Moderator can upload/save; resort
deletion remains Admin-only. Saving uses the existing version check and audit
log. No database migration is required: localized `galleryDetails` metadata
is stored alongside the existing `gallery` URL array. Old galleries remain
compatible without metadata.

Bundled photos and CMS uploads use Next.js Image's responsive optimizer at
quality 75 or 80. Hero images alone are prioritized. External CMS/live-camera
URLs still render through Next.js Image but remain unoptimized, preserving
their existing behavior without allowing an unrestricted remote-image proxy.
SVG and canvas/map rendering retain their existing behavior.

## Watermarked downloads

The explicit lightbox download calls `/api/gallery/{slug}/{index}?locale=ka`
(or `en`). The public Node.js server loads only that resort's CMS-selected
local photo, applies EXIF orientation, and creates a separate full-resolution
JPEG with the official MTA mountain mark and both captions:

- Photo belongs to MTA
- ფოტო ეკუთვნის MTA-ს

Sources are never overwritten. Downloads are generated on demand with Sharp,
with up to two concurrent generations and a bounded 16-entry warm-process
cache. Cold starts regenerate derivatives; no permanent derivative storage
is required. API originals, the logo, and the FiraGO font must remain available
in deployment. Next's tracing configuration includes bundled download assets.
The watermark applies to the explicit **Download** action; browser save/right-
click cannot be prevented from accessing the displayed clean image.

## Verification and Bakuriani import

Run `node scripts/check-resort-gallery.mjs` against the local running API/site.
It checks all four resorts, bilingual persistence, ordering/removal, validation,
original hashes, download dimensions, anonymous/Moderator permissions and
conflict handling. It restores resort records and removes its temporary user.
Uploaded test originals are retained, consistent with normal gallery removal.

`scripts/bakuriani-gallery.json` defines the 12 selected Bakuriani photographs.
Run `node scripts/import-bakuriani-gallery.mjs "<original-photo-folder>"` to
import them. It backs up the existing record, verifies stored SHA-256 hashes,
and checks that the other resorts are unchanged. Gudauri, Mestia and Goderdzi
retain their original galleries pending replacement photos from the owner.
