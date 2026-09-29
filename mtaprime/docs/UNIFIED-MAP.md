# Unified resort map

The old route fallback rendered ResortLiveMap, a static image/SVG presentation with no zoom transform or fullscreen behavior and a permanently selected details card. Only Gudauri/Kobi used InteractiveTrailMap. All map routes now use the service-loaded InteractiveTrailMap; no route renders the old implementation.

Gudauri and Kobi remain a combined resort route. Area buttons select their independent records without resetting the camera. Goderdzi uses its supplied winter map image. Other resorts use their existing reference photos until map assets are supplied.

## Data contract
src/data/mocks/map-operations.json contains two lifts, two pistes and two warnings per requested area. Service getMapOperations selects these ONLY in DATA_SOURCE=fixtures. DATA_SOURCE=api uses existing resortOperations, closures and avalanches services; getTrailMap uses maps/{slug}. No component imports a fixture or mock file.

Operations: {lifts:[],trails:[]}. Each entry has id, areaId, name, status, optional difficulty/hours/type, and mapPosition:{mapId,x,y,verified}. Safety entries additionally use title, slug and description. Coordinates use source-image pixels. API coordinates require verified:true. Explicit demo records may use unverified coordinates only when the map is also in demo mode. Mock warnings never enter the site's safety feed and never link to nonexistent safety records. The viewer consumes the same normalized MapRecord model in both modes.

Demo banners distinguish sample positions/statuses/hours from operational facts. Printed markings on the Goderdzi image cannot be toggled; layer controls remove interactive pins. Replace the base image in data if a clean background is supplied.

Fullscreen uses a fixed viewport overlay (not the browser Fullscreen API), with Escape exit, focus trapping and portal popups. No pan/zoom library is installed; one transform state drives image and pin coordinates.

CMS-managed maps use the same fixed source-image coordinate system. Straight anchors are stored as `[x,y]`; pen-tool curves are stored compatibly as `[x,y,inX,inY,outX,outY]`. The public SVG viewer scales the reference image and every anchor/control point through one responsive `viewBox`, so desktop, tablet and mobile preserve exact alignment. The admin editor uses React Konva; saving a feature makes it live immediately, while optimistic map and feature versions prevent silent concurrent overwrites.

## Route and popup review (Tasks 1–2)
Pistes/lifts have startPoint and endPoint using {mapId,x,y,verified}, in source-image pixels. The service normalizes valid endpoints to points; API endpoints require verified coordinates, demo endpoints remain explicitly unverified. Lines use the same camera transform as terrain and render below pins. Difficulty colors reuse existing tokens; lifts are dashed ink. Layer filtering removes both pins and paths.

Popups still portal into document.body. Their fixed screen position is measured from the clicked pin and clamped to the visible map rectangle, with side/above/below placement. Pan, wheel/button/keyboard zoom, page scroll and resize close the popup so it cannot become detached. Scrolling inside a tall popup remains usable. Tasks 3–5 (brand audit and realistic names/records) are awaiting the user's visual approval.
