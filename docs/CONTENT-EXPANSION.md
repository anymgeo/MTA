# Content expansion

New localized routes cover Safety topics and alerts, Events and competitions, About history/leadership/infrastructure/documents, and Webcams. Projects and Contact extend their existing pages; Structure remains the organization chart. The combined Gudauri–Kobi route is preserved.

## Data contract
src/services/portal.js is the async boundary. DATA_SOURCE=fixtures reads src/data/fixtures/portal.json and resolves message references; DATA_SOURCE=api requests each collection name with locale. Collections: safety, contacts, closures, avalanches, events, history, leadership, infrastructure, documents, webcams, navigation, resortOperations. Models and shared area/date filtering live in src/models/portal.js. Runtime validation rejects malformed records and unsafe URLs. API text must arrive localized.

Common fields: id, slug, title, description; optional areaId/area, category/type/status, startAt/endAt/publishedAt/updatedAt (ISO dates), image/images, blocks, links, specs, mapUrl/videoUrl, files (name, URL ending .pdf, application/pdf). Events also support schedule/participants/changes/results/media blocks. Leadership supports position. Contacts support phone. Navigation supports href. Operations additionally support hours, lifts/trails (id/name/status/hours/difficulty/specs), weather/prices (label/value), purchaseUrl, files and updatedAt. Stable area identifiers use resort slugs; gudauri/kobi aliases match gudauri-kobi; all is global.

Restrictions surface on resort pages only while active and within their time range. Empty alert feeds mean unavailable, never an all-clear. Live collections bypass fetch caching. Event date filters include both endpoints; documents sort by category and newest publication date. Project lifecycle dates are separate from publication dates and remain unpublished when unknown.

## Content provenance and limits
Reviewed 2026-09-18: https://mta.ski/en/about and https://mta.ski/ge/about (history/leadership/address), https://mta.ski/en (classification), https://112.gov.ge/?lang=en&page_id=1715 (112), https://www.fis-ski.com/inside-fis/document-library/general-regulations (conduct PDF), https://mta.ski/en/event/2026/Flavors_Event_Eng and https://www.freerideworldtour.com/events/2024-georgia-pro/ (archived events). The official language versions disagree on rebranding year, so that year is omitted. Office address updated to 70 Kostava Street, second floor. Infrastructure reuses existing catalog data; it is not live operational data.

No verified current closures, avalanche bulletin, operational feed, checkout URL, official downloadable piste map, leadership CVs or biographies were provided. These remain unavailable, with official links where possible. Webcams currently display a clearly labeled recorded placeholder. Existing historical projects have unknown lifecycle status/dates.

PDF selection is a local browser preview, not persisted publishing; server storage/authentication and upload authorization are not configured. Registered PDFs support view and attachment download through /api/documents/download, which allowlists content URLs, restricts local paths, limits remote size, rejects redirects and checks PDF signature. The contact endpoint validates fields/honeypot and returns NOT_CONFIGURED (503) until a delivery provider is configured. It never reports false delivery success.

## Checks
node --test tests/content.test.mjs; npm run lint; npm run build; start on port 3100 then node tests/routes.mjs. Route checks include both locales, SEO, redirects, invalid pages, PDF download and contact boundaries.
