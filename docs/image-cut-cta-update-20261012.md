# Image replacement, line cuts, lift symbols and Skipass CTA

## Image replacement: exact changed files

Repository root: `D:/OneDrive - Mountain Resorts Georgia/Desktop/MTAPRIMELang`.

The exact 169-file implementation release manifest (including every derived tile filename) is [image-cut-release-files-20261012.txt](./image-cut-release-files-20261012.txt). The source changes are explained below.

- `mta.api/MapEditor.cs`: removes both reference-dimension rejection branches, stages uploads, confirms alignment in one DB transaction, transforms all anchors/handles/labels including deleted features, and preserves native metadata/version/audit records. Adds optional cut-label metadata to the existing JSONB field.
- `mta.api/MapImageReplacement.cs` (new): private pending-image manifests, user/map/version checks, affine transforms and confirmation contract. Originals are immutable, staged images expire for confirmation after 48 hours; files are not automatically purged.
- `mta.api/MapImageStorage.cs`, `mta.api/map-tiles.mjs`: correct Deep Zoom output basename/extension, validate emitted tiles before publishing a manifest, and resolve previously generated tile URLs without changing originals or map geometry. The `.dz` basename convention follows [Sharp's output documentation](https://sharp.pixelplumbing.com/api-output/#tile).
- `mta.admin/app/ui/map-editor.tsx`: upload → preview → confirm, unsaved drawing protection and history reset at a new coordinate reference; Cut & label tool and controls.
- `mta.admin/app/ui/map-image-replacement.tsx` (new): tiled preview with existing geometry, uniform fit / explicit X-Y scaling, rotation, offsets, image opacity, geographic confirmation, out-of-frame notice, keyboard-focus handling and cancel.
- `mta.admin/app/ui/map-model.ts`: optional cut metadata in a label.
- `mta.admin/app/ui/map-canvas.tsx`: existing pointer/drawing architecture retained; shared lift symbols and cut masking/label rendering.
- `mta.admin/app/vector-map.css`: image-alignment dialog styling only; no replacement of the drawing workspace.
- `shared/map-geometry.mjs`, `shared/map-geometry.d.mts`, `shared/map-geometry.test.mjs`: affine transforms, fit presets, exact cubic/arc geometry, shared lift ticks and on-path cut-label positions; eight mathematical tests.
- `scripts/check-map-editor.mjs`: verifies staging/confirmation and restores the original reference through the new workflow.
- `scripts/export-public-snapshot.mjs`, `mtaprime/src/data/published-snapshot.json`: export real tile extensions and all public media. Generated files under `mtaprime/public/published-media/` are listed exactly, with SHA-256, in the snapshot's `assets` array.
- `docs/vector-map-editor-20261012.md`, this report: corrected setup/limits and verification record.

Other files changed for the requested public styling:

- `mtaprime/src/components/brand/SkipassCTA.jsx` (new)
- `mtaprime/src/components/Header.jsx`
- `mtaprime/src/components/Hero.jsx`
- `mtaprime/src/components/Footer.jsx`
- `mtaprime/src/components/SkiPassModal.jsx`
- `mtaprime/src/components/resort/ResortDetails.jsx`
- `mtaprime/src/components/resort/InteractiveTrailMap.jsx`
- `mtaprime/src/components/resort/CmsTrailMap.jsx`
- `mtaprime/src/app/brand-navigation.css`
- `mtaprime/src/app/globals.css`
- `mtaprime/messages/ka.json`, `mtaprime/messages/en.json`: missing weekend-hours label corrected after browser console QA.

## Limits found and status

| Layer | Found limit | Updated behavior |
| --- | --- | --- |
| Reference image | Two API branches required the old width/height when features existed | Removed; any positive decoded dimensions/aspect ratio can be staged and aligned |
| Frontend map upload | Earlier 40 MB check and 20-second client timeout | Removed in the map-upload flow; binary stream, no client timer |
| Next proxy | General `/backend` buffered rewrite bounded at 48 MB | Map upload bypasses it through `/map-upload/:id`; unrelated CMS requests keep the bound |
| API | Earlier 40 MB, 16000 px and 64 MP map checks; Kestrel default 48 MB | No application image-size/dimension cap on protected map upload routes |
| Image decoding | Sharp default input-pixel protection | Disabled for the map worker; bounded cache/concurrency and 512 px viewport tiles |
| Own-server Nginx template | General uploads 6 MB | Map-upload location uses `client_max_body_size 0`, streaming, 3600-second proxy/body timeouts |
| Storage | Physical disk/RAM/decoder format limits | Unavoidable infrastructure limits remain; originals are never recompressed, resized or overwritten |

PNG/JPG/WebP remain the supported raster formats. “Any resolution” does not mean arbitrary non-image file formats or infinite server resources. No environment variables, credentials or database schema were changed for this replacement/cut update. The earlier additive vector-label/tile migration was already applied.

## Actual verification

Protected API + PostgreSQL, and the running browser application:

- Upload 1961×1455 PNG; replace with 8192×7181 JPG (55,019,239 bytes); replace with 17000×4200 PNG (71.4 MP). Each original's SHA-256 matched the uploaded bytes.
- Existing trail and lift had cubic handles, anchor modes, bilingual labels and metadata; a warning was also present. Feature IDs, counts, names, categories and original creation metadata survived. Every coordinate pair was transformed; saved data reloaded and matched the public API.
- Browser upload of the 55 MB JPG through Next completed. Preview did not modify the live map. Changing offsets updated the overlay; Confirm required explicit geographic acknowledgment. Cancel retained the old 17000×4200 reference.
- Different-aspect-ratio 2700×900 replacement confirmed and reloaded with drawings, lift symbols, cut and name intact. A stale editor was rejected with 409 and could reload safely.
- Corrupt upload, invalid scale and stale confirmation left the entire live map unchanged. Moderator upload/delete denied; normal feature create/edit still permitted.
- Cut tool clicked an existing curve, opened bilingual label fields, and left the underlying SVG cubic `d` unchanged. Label dragging snapped to the curve; Undo restored it. Save/reload preserved the cut. English public label was `Yaila 2`, Georgian was `იაილა 2`; saved positions and rotation matched the admin.
- Empty label text retained a gap without a name; invalid cut positions were rejected. Original label text was restored after testing.
- Lift ticks regenerated after anchor edits; undo/redo were exact. Saved admin/public tick paths matched. Tick lengths/spacing scale with image resolution, while the global styling is configured in `shared/map-geometry.mjs`.
- Large-image zoom/pan, viewport-bounded tile loading and native geometry were exercised. The original drawing/editing/undo system was not replaced for this fix.
- Final export detected a legacy `.dzi_files`/`.jpeg` naming mismatch. It was repaired with a compatibility reader (no drawing/version changes) and corrected future output. All 68 tiles for each of Bakuriani and Goderdzi were fetched successfully across every pyramid level; 63 anonymous API responses and 240 media files were exported.
- API build, admin production build/typecheck, public production build and targeted lint passed. Mathematical tests passed (8/8).
- CTA base-state text contrast is at least 14.8:1. The reusable charcoal CTA has icy winter / soft green summer accents, accessible focus, reduced-motion handling and preserved handlers/URLs. No old red `brand-cta-primary` instances remain. A Georgian header compression issue at 1440 px was corrected by using the collapsed menu below 1600 px.
- Final production-mode snapshot checks passed: all 240 original media hashes, four watermarked downloads with clean sources unchanged, bilingual News/Today routes, responsive image optimization and the contact safeguard. A fresh browser tested 40 page/locale/viewport combinations (1600 px desktop and 390 px mobile); no missing heading, horizontal overflow, undersized visible CTA or console warning/error occurred. Tablet (820 px) season/language switching, Skipass modal and logo-home navigation worked; header CTA at 1440 px remained unclipped and 48 px tall.

QA data used an isolated resort, not real resort drawings. Test media remains in ignored local storage; the QA resort is removed before public snapshot export. Production hosting remains the user-approved public Vercel snapshot, with API/Admin local. Docker/Nginx containers were not executed on this machine (Docker unavailable).

## Production deployment verification

- Public implementation commit: `26adaf259fe59ec1f4304d1bcf000697e5639ca6`, pushed to `codex/content-cms`.
- Existing Vercel project `mta` / `prj_ZFbXuRjYH6QEe3QQL5IPLP3IbtER`; no new project or domain configuration created.
- Production build `dpl_BjCFXvMN3mfizwcy4E8EmxGbeMVP` reached READY (52-second build). It was staged, verified, then promoted without rebuilding. `vercel inspect https://mta-five.vercel.app` resolved this exact deployment.
- Verified live at [mta-five.vercel.app](https://mta-five.vercel.app/ka): 40 desktop/mobile/locale combinations, all four resort maps' native cubic/tick paths matching the public JSON API, homepage, News and Projects list/detail, Today, CTA variants, four watermarked downloads and all 240 media SHA-256 hashes. Console errors/warnings: none in the fresh production test tab. Bounded new-deployment error-log scan: no error entries returned.
- Local API and Admin were built, restarted and verified. They were deliberately not exposed or deployed to Vercel. Production uses the exported public CMS data; future local CMS changes require a fresh snapshot export/deployment to appear there. No new schema migration was required for this release; the earlier additive vector-label/tile migration was already applied locally. Existing records, source media, secrets and environment configuration were preserved.
- Incremental semantic code index refreshed successfully (338 files; no full rebuild).

## Admin usage

1. Refresh `http://127.0.0.1:3101`.
2. Resort → Visual map editor → Upload & preview map image.
3. Check the new image/drawings; adjust scale, rotation or offsets as needed. Confirm geographic alignment, then Confirm replacement. No live map changes occur before confirmation.
4. Select **Cut & label (C)**, click an existing trail/lift, edit the two label texts and Save. Clear both texts for a gap only. Drag the label along the curve; Remove cut keeps an ordinary label, while Remove map label removes the entire label/gap. This is one optional label cut per feature, not deletion or division of the saved Bézier into separate objects.
