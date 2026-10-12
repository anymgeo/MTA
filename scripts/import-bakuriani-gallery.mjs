import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const source = process.argv[2];
if (!source) throw new Error('Provide the Bakuriani photo folder. Originals are uploaded without modification.');
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const manifest = JSON.parse(await readFile(new URL('./bakuriani-gallery.json', import.meta.url)));
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url)));
const cookies = new Map();
async function request(route, method = 'GET', body) {
  const headers = {};
  if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
  headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const response = await fetch(origin + route, { method, headers, body });
  for (const cookie of response.headers.getSetCookie()) { const pair = cookie.split(';')[0], i = pair.indexOf('='); cookies.set(pair.slice(0, i), pair.slice(i + 1)); }
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${await response.text()}`);
  return response;
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await request('/api/admin/login', 'POST', { email: credentials.AdminEmail, password: credentials.AdminPassword });
const resorts = await (await request('/api/admin/resorts')).json();
const resort = resorts.find(r => r.slug === 'bakuriani'); assert(resort);
if (resort.en.galleryDetails?.length === 12 && resort.en.galleryDetails.every((p, i) => p.title === manifest[i].en)) {
  for (let i = 0; i < manifest.length; i++) {
    const photo = manifest[i], stored = Buffer.from(await (await fetch(origin + resort.en.gallery[i])).arrayBuffer());
    assert.equal(hash(stored), hash(await readFile(path.join(source, photo.file))), `Original changed: ${photo.file}`);
    assert.equal(resort.ka.galleryDetails[i].title, photo.ka);
    assert.equal(resort.ka.galleryDetails[i].category, photo.categoryKa);
    assert.equal(resort.en.galleryDetails[i].category, photo.categoryEn);
  }
  console.log('Verified all 12 original SHA-256 hashes and bilingual titles/categories; no changes made.'); process.exit(0);
}
await mkdir(new URL('../.local/gallery-backups/', import.meta.url), { recursive: true });
await writeFile(new URL(`../.local/gallery-backups/bakuriani-${Date.now()}.json`, import.meta.url), JSON.stringify(resort));
const ka = [], en = [];
for (const photo of manifest) {
  const bytes = await readFile(path.join(source, photo.file));
  const body = new FormData(); body.set('file', new Blob([bytes], { type: 'image/jpeg' }), photo.file);
  const { url } = await (await request('/api/admin/gallery-photo', 'POST', body)).json();
  const stored = Buffer.from(await (await fetch(origin + url)).arrayBuffer());
  assert.equal(hash(stored), hash(bytes), `Original changed: ${photo.file}`);
  ka.push({ url, title: photo.ka, category: photo.categoryKa }); en.push({ url, title: photo.en, category: photo.categoryEn });
}
const gallery = en.map(p => p.url);
resort.ka = { ...resort.ka, gallery, galleryDetails: ka }; resort.en = { ...resort.en, gallery, galleryDetails: en };
await request(`/api/admin/resorts/${resort.id}`, 'PUT', resort);
const saved = (await (await request('/api/admin/resorts')).json()).find(r => r.id === resort.id);
assert.deepEqual(saved.ka.galleryDetails, ka); assert.deepEqual(saved.en.galleryDetails, en);
for (const old of resorts.filter(r => r.slug !== 'bakuriani')) {
  const current = (await (await request('/api/admin/resorts')).json()).find(r => r.id === old.id);
  assert.deepEqual(current, old, `${old.slug} was changed`);
}
console.log('Imported 12 bilingual/category photos into Bakuriani; SHA-256 originals match; other three resorts unchanged.');
