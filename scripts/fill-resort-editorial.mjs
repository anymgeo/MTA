import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Add only missing copy through the normal authenticated, audited CMS endpoints.
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const copy = JSON.parse(await readFile(new URL('./resort-editorial.json', import.meta.url)));
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url)));
const cookies = new Map();
async function request(route, method = 'GET', body) {
  const headers = {};
  if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
  headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
  if (body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const response = await fetch(origin + route, { method, headers, body });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0], separator = pair.indexOf('=');
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status}`);
  return response;
}
await request('/api/admin/login', 'POST', { email: credentials.AdminEmail, password: credentials.AdminPassword });
const resorts = await (await request('/api/admin/resorts')).json();
await mkdir(new URL('../.local/editorial-backups/', import.meta.url), { recursive: true });
for (const resort of resorts) {
  const entry = copy[resort.slug];
  if (!entry) continue;
  const before = structuredClone(resort);
  let changes = 0;
  for (const locale of ['ka', 'en']) {
    resort[locale].page ||= {};
    for (const [field, text] of Object.entries(entry[locale])) {
      if (!resort[locale].page[field]?.trim()) { resort[locale].page[field] = text; changes++; }
    }
  }
  if (changes) {
    await writeFile(new URL(`../.local/editorial-backups/${resort.slug}-${Date.now()}.json`, import.meta.url), JSON.stringify(before));
    await request(`/api/admin/resorts/${resort.id}`, 'PUT', resort);
  }
  const saved = (await (await request('/api/admin/resorts')).json()).find(item => item.id === resort.id);
  for (const locale of ['ka', 'en']) {
    for (const field of Object.keys(entry[locale])) assert(saved[locale].page[field]?.trim());
    assert.deepEqual(saved[locale].gallery, before[locale].gallery, 'Gallery preserved');
    assert.deepEqual(saved[locale].galleryDetails, before[locale].galleryDetails, 'Photo metadata preserved');
  }
  console.log(`PASS ${resort.slug}: ${changes} missing editorial fields filled; both languages persisted; original galleries preserved`);
}
