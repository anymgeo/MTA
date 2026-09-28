# UI refinement

HeaderSnow adds a capped, 30fps header-only canvas with varied motion, size, opacity and crystals. Hidden tabs and reduced-motion preferences stop it; unmount cleans observers and listeners. Hero snow is unchanged.

Camera catalog and detail pages share src/services/webcams.js. It joins existing resort imagery with webcam feed records. Only a feed with status live and a video URL receives the live badge. Recorded videos and missing feeds are labeled accurately; unverified fixture weather and update timestamps are not repeated on camera pages. Homepage camera cards now link to localized /webcams/[slug] routes. Video loads after a visitor clicks the play control and includes a source fallback.

Safety hover colors, emergency text and card hierarchy are corrected. Existing anchors and all topic routes remain. About overrides arbitrary word wrapping with normal word boundaries, smaller responsive headings, balanced lines and controlled brand accents.

## Gudauri map reference mismatch
The supplied GudauriTrailsMap.png is used unmodified as the background. GoderdziWinter.jpg is labeled Goderdzi, Zanka and Chanchakhi, so its routes must not be plotted on Gudauri. No matching annotated Gudauri reference exists in public/. Trail-map fixtures therefore set verified:false and contain no invented geometry. The zoom/pan viewer is wired to the resort page and full map route; trail/lift/POI/label/zone SVG rendering, hover, keyboard selection, layers and detail cards are ready for the matching verified geometry.

Coordinates are image-space pixels within width/height and use one SVG viewBox with the background. This keeps overlays aligned at every zoom and breakpoint. Mobile uses a scrollable minimum-width canvas to keep features readable; mouse users can drag. Geometry is validated at the service boundary. Add localized records with id/kind/name/description/points/status/type/difficulty in src/data/fixtures/trail-maps.json, or return the same model from maps/{slug}; set verified only after checking the matching source.
