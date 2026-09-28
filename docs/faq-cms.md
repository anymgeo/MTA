# CMS-managed FAQs

Admin → FAQ supports the main FAQ page and each resort page. Both WebPortalAdmin and WebPortalModerator can add, edit, delete, publish/unpublish and reorder items. Lower order numbers appear first; identical orders use the immutable ID as a stable tie-breaker.

Both question and answer translations are required. Optional category labels must have both translations. Answers are plain text (line breaks preserved), never executable HTML. Resort scopes are validated against existing CMS resorts.

Public contract: GET /api/faqs?locale=ka|en&scope=<resort-slug>. Omit scope for the main FAQ page. Only published rows are returned, with id, sortOrder, category, question and answer. Public pages use uncached server-side API reads; no FAQ content or fallback dataset remains in the frontend.

Admin contract: GET/POST /api/admin/faqs, PUT /api/admin/faqs/{id}, DELETE /api/admin/faqs/{id}?version={version}. Writes use existing session authentication and CSRF protection. Updates/deletes return 409 for stale versions; refresh before retrying. All writes are audited.

Migration 20260925140000_CmsFaqs creates the table and copies all 34 bilingual items exactly once: 14 general items plus five for each of four resorts. It does not reseed on startup, overwrite edits, or recreate deleted FAQs. Down removes the FAQ table; back up edited content before any downgrade.

Deployment: apply EF migrations using the existing secured database configuration before starting the updated API/public site. Then deploy the Admin and public builds. FAQ API access is required even when other portal content uses fixture mode. The local database migration was applied during implementation; production still needs its normal migration/deployment.

Verification: node scripts/check-faqs.mjs uses local test credentials (never printed), creates temporary FAQ rows and a temporary moderator, verifies both roles, then removes its test records in finally.
