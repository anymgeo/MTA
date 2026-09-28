# Live mountain cards

The existing LiveMountainData and ResortCard implementations were refactored. News remains immediately before this section.

## Admin and storage

Admin → Resorts → Edit → Homepage card manages independent winter/summer images, bilingual alt text and note, featured state, homepage visibility and display order.
Uploads use the existing media endpoint. Reset removes the override and uses the resort photo without deleting the media file.
Shared values are copied to both locales; notes and alt text are edited per language.

Settings are optional liveCard objects in the existing Resort.KaJson and Resort.EnJson JSONB columns. No new database migration is required. Existing cards retain their images and order; no resort is automatically featured.

## External feed integration

Implement ILiveConditionsProvider in mta.api/LiveConditions.cs and replace its registration in Program.cs. Map external resort identifiers to the existing IDs/slugs. Return nullable numeric measurements, source observation timestamps, and canonical status/weather/visibility keys.
The provider must respect cancellation. Each resort has an independent five-second timeout. The default provider returns unavailable with no fabricated timestamp.

GET /api/resorts/conditions exposes observations. The public Next route /api/resort-conditions forwards them; the section refreshes every minute. Admin reads observations through its existing proxy as read-only information.
When the provider's IsActive is true, legacy operational controls are locked in Admin and the backend preserves their stored values on CMS writes. CMS submissions cannot populate the provider.

Statuses: open, closed, limited, delayed, hold, maintenance, unavailable.
Weather: clear, partlyCloudy, cloudy, snow, lightSnow, rain, fog.
Visibility: excellent, good, moderate, poor. Wind direction: N/NE/E/SE/S/SW/W/NW.
Operating times: HH:mm. Timestamps: ISO 8601 with timezone.

Freshness warnings begin at 45 minutes; observations expire after six hours. Missing, invalid, unknown-status and significantly future-dated observations show unavailable. Relative labels update every 15 seconds in Georgian/English.

## Changed files

- mta.api/LiveConditions.cs: DTO, provider contract, safe default.
- mta.api/Program.cs: provider registration.
- mta.api/Resorts.cs: endpoint, presentation validation, live-field write protection, ownership flag.
- mta.admin/app/ui/resorts.tsx: card editor, uploads/reset, localized settings, read-only observations.
- mta.admin/app/brand.css: settings layout.
- mtaprime/src/components/LiveMountainData.jsx: section, polling, skeletons, ordering, visibility.
- mtaprime/src/components/ResortCard.jsx: imagery, metrics, status, freshness, featured state.
- mtaprime/src/components/pages/HomePage.jsx: removes obsolete card-selection props.
- mtaprime/src/app/api/resort-conditions/route.js: server proxy.
- mtaprime/src/models/live-conditions.js: status mapping and freshness handling.
- mtaprime/src/models/content.js: shared model documentation.
- mtaprime/src/app/globals.css: responsive card styles.
- mtaprime/messages/en.json and ka.json: labels, units, weather/status and relative-time translations.
- scripts/check-live-cards.mjs: observation boundary checks.
- checks/LiveCards/LiveCards.csproj and Program.cs: backend validation/persistence/write-protection checks without database writes.

## Verification and activation

Run node scripts/check-live-cards.mjs.
Run dotnet run --project checks/LiveCards -c Release -- ABSOLUTE_PATH_TO_SEED_RESORTS_JSON.
Build public and Admin with npm run build, and API with dotnet build -c Release.
Restart/deploy the API and Admin to activate the new backend/editor. Supply an external feed adapter to show real readings; unavailable is intentional until it is connected.
