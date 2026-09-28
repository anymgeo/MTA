# Frontend data contract

The app remains JavaScript/JSX. JSDoc models live in src/models/content.js, with runtime checks in src/models/validate.js.

Server pages call async functions in src/services. Presentational components receive serializable, already localized records and do not import fixtures. UI copy is organized by section in messages/en.json and messages/ka.json. Static editorial content is resolved from fixture message references in the services, so a later CMS can provide localized strings without changing components.

## Environment

Copy .env.example to .env.local. SITE_URL is the canonical production origin (default https://mta.ski). DATA_SOURCE defaults to fixtures. API_BASE_URL and API_TOKEN are server-only and must never use NEXT_PUBLIC_ prefixes. No backend is contacted in fixture mode.

## API mode

Set DATA_SOURCE=api only when the backend implements GET /resorts, /news, /projects and /activities relative to API_BASE_URL. Every request has a locale=ka or locale=en query. Responses must be JSON arrays matching the JSDoc models, with localized text, stable IDs/slugs, ISO dates, and asset URLs. Project resortId must remain stable across locales. Resort status remains OPEN, LIMITED or CLOSED. Activity seasons use winter and summer; experience iconKey values stay stable.

Fetches use a 10-second timeout, optional bearer token, and explicit revalidation (60 seconds for resorts, 300 for editorial content). HTTP failures and malformed collections reach the localized error boundary; missing slugs return the localized 404. No errors silently fall back to fixtures.

The current fixture measurements and webcam images are sample/static content, not a live operational feed. Replace them with verified upstream data before presenting freshness guarantees. Some original editorial content also needs owner review (for example the Mestia hiking article mentions Goderdzi in its body).

## Contact

The form uses sendContactMessage and a same-origin /api/contact boundary. It returns 503 with a clear localized message until a verified mail/CRM integration is implemented. It does not store, log or forward submitted personal data. Add server validation, rate limiting and the verified destination before enabling delivery.

## Rendering and season

The locale layout validates ka/en and sets the HTML language. src/proxy.js redirects unprefixed paths; localized navigation preserves query strings and hashes. Locale paths have canonical, hreflang, OpenGraph and Twitter metadata, plus sitemap.xml and robots.txt. Existing route slugs stay unchanged.

SeasonProvider uses useSyncExternalStore and localStorage under mta-season. It shares one winter/summer value across the header, home content, resort experience and map, and across tabs. The server defaults to winter to keep routes static; a remembered summer preference is restored after hydration. Storage failures fall back to an in-memory preference.

## Verification

Run npm run lint and npm run build. Run node --test tests/content.test.mjs for message parity, ICU validity, fixture references and model validation. After npm run start -- --port 3100, run node tests/routes.mjs to check all locale routes, metadata, redirects, static assets and 404s. Browser checks also cover season reload persistence, nested-route language switching and project filters.

A shared root loading boundary is deliberately omitted so missing detail records can return HTTP 404 before streaming starts. LoadingState is reusable for future isolated loading views; the language control exposes its pending state.
