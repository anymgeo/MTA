# Vector map editor

The editor keeps the existing .NET/PostgreSQL CMS and the public map layout. The drawing surface uses SVG and a shared geometry module (`shared/map-geometry.mjs`).

## Causes corrected

- The toolbar enumerated every database feature type, including official tracing/catalog types, and gave most of them the same pencil icon. The toolbar now contains exactly Select, Trail, Lift, Warning and Pan, with distinct icons.
- `commit()` compared its baseline before applying the change, so many actions were never recorded. A single ordered before/after history now records local edits and API-backed saves/deletions. Selection alone is not an undo step.
- Pointer gestures were split between Konva stage/shape events and dragging, the preview was a straight line, and insertion added a raw cursor point rather than splitting the cubic. One pointer-captured SVG interaction system now uses image-native coordinates, cubic preview, adaptive hit testing and De Casteljau insertion.
- Fullscreen properties previously covered PrimeReact's portalled dropdowns. Map properties now use native labeled selects.

## Geometry and workflow

Anchors retain the compatible `[x,y,inX,inY,outX,outY]` representation; old `[x,y]` points remain valid. A segment uses the previous anchor's outgoing control point and the next anchor's incoming control point. All coordinates are absolute original-image pixels. Handles may extend beyond the image; anchors stay within it. The backend stores point JSON, anchor modes and optional bilingual label JSON. Both viewers call the same cubic path serializer.

Click places a corner anchor; click-drag places a smooth anchor with direction handles. The outgoing cubic preview follows the pointer. Finish via Enter, double-clicking the last anchor or Finish. Select anchors/handles to drag them. Smooth handles keep opposite directions while retaining independent lengths; Alt/Option on a handle breaks the linkage. Corner/Smooth controls are available. Double-click an existing segment to insert an anchor without changing its shape; Delete anchor removes one anchor while preserving the rest.

Enter both names, choose difficulty (trail) or lift type, then Save. Colors derive from category, shared by editor and public map. Add a map label, enter both texts and drag the label independently. Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y include placements, drag gestures, insertion/deletion, finish, metadata, label text/position and persisted saves/deletions. Buttons reflect available history. Reload starts a new editing history; the server audit remains persistent. Concurrent edits return 409 and retain the draft for review.

## Original images and limits

- Frontend: removed the 40 MB validation. Binary uploads stream through `/map-upload/:id`; the old buffered `/backend/*` rewrite is bypassed. Upload has no client timer.
- Next: the new route forwards the request stream directly. General CMS requests retain their existing limit.
- API: removed the map image 40 MB, 16,000 px and 64 MP limits. Kestrel's body-size limit is disabled only for protected map image endpoints. Raw and legacy multipart input stream to disk; image inspection does not buffer the complete encoded file.
- Storage: source files are stored byte-for-byte, never overwritten or resized. A separate Sharp/libvips worker produces 512 px Deep Zoom tiles and a small preview, with the input pixel cap disabled and bounded cache/concurrency. Only viewport tiles are decoded by the browser. Different dimensions and aspect ratios are supported through a staged image/alignment preview and an atomic coordinate transformation; there is no same-dimensions restriction.
- Own-server proxy: the Nginx template has an unbounded, unbuffered map-upload location with extended timeouts. Docker includes Node and platform-specific Sharp dependencies.
- Temporary public snapshot: export streams original files without the old 45 MB limit and includes the entire tile pyramid. Public/admin hosting still follows the existing arrangement: local API/Admin, public Vercel snapshots. Disk capacity, image-format limits and any external hosting-provider limits remain infrastructure constraints; the app does not claim unlimited physical resources.

## Setup

Run `npm ci --prefix mta.api` to install the image worker dependencies. Node 24 is used locally and in Docker. `MapTiles__NodePath` optionally selects a Node executable. Apply `20261012095330_VectorMapLabelsAndTiles` after backing up the DB (`dotnet ef database update --project mta.api`). It only adds `ResortMaps.TilesJson`, `MapFeatures.AnchorModesJson` and `MapFeatures.LabelJson`; existing content is retained. Local backup: `.local/vector-backups/mta-before-vector-editor.dump`.

Next builds require the repository-level `shared` directory. Docker contexts now include it. Docker/Nginx container execution was not tested on this machine because Docker is unavailable; local Next + Kestrel + PostgreSQL were tested directly.

## Running-app verification, 12 October 2026

An isolated `vector-map-qa` resort was created and backed up, then removed after testing. Existing resort geometry was not edited.

Passed in the running editor/API/public map:

- Exactly five distinct tools, with correct enabled/disabled undo controls.
- Click placement, click-drag cubic creation, incoming/outgoing handle dragging, smooth/corner conversion and Alt-modified handle break followed by independent drag.
- Cubic preview; finish by Enter, visible Finish and double-click, with no duplicate last anchor.
- Multiple consecutive Ctrl+Z/Ctrl+Shift+Z restores points/finish in order; Ctrl+Y also restores.
- Anchor move/insert/delete and exact history restoration. Mathematical tests verify De Casteljau subdivision invariance to <1e-9 and curved hit-test distance <0.01 image pixels.
- All three difficulty colors change immediately; lift and warning colors are distinct. Metadata undo restores the color.
- Bilingual names/label text, independent label dragging and text/position history.
- Save, saved creation undo/redo, saved metadata edit undo/redo, delete/restore/redo and reload. API versions, audit entries and public data were verified.
- Public SVG `d` equals saved editor `d` exactly, in Georgian/English; localized labels and public search work.
- Resize and zoom/pan retain native geometry. Desktop and 390 px mobile layouts have no horizontal page overflow; tile counts remain viewport-bounded.
- A 55,019,239-byte 8192×7181 JPG uploaded through the Next streaming route. SHA-256 matches the original. A 17000×4200 (71.4 MP) PNG uploaded through the protected API, with unchanged bytes and tiles.
- Moderator create/edit allowed; delete/upload denied; stale versions and invalid anchors/metadata rejected.

Proof image: `.local/vector-editor-qa-20261012.png`. QA fixture backup: `.local/vector-backups/vector-qa-resort.json`. Production build/typecheck and API compilation were run after the changes.
