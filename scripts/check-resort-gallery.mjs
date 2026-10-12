import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const sharp = createRequire(new URL('../mtaprime/package.json', import.meta.url))('sharp');
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const site = process.env.TEST_SITE_ORIGIN || 'http://localhost:3100';
const creds = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url)));
function client() {
  const jar = new Map();
  return async function request(route, method = 'GET', body) {
    const headers = {};
    if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
    headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(origin + route, { method, headers, body });
    for (const value of response.headers.getSetCookie()) { const pair = value.split(';')[0], i = pair.indexOf('='); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
    return response;
  };
}
const admin = client(), moderator = client(), anonymous = client();
async function json(response, expected = 200) { const result = await response.json(); assert.equal(response.status, expected, JSON.stringify(result)); return result; }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
let user;
try {
  assert.equal((await anonymous('/api/admin/gallery-photo', 'POST', new FormData())).status, 401);
  await json(await admin('/api/admin/login', 'POST', { email: creds.AdminEmail, password: creds.AdminPassword }));
  const password = 'Gallery!'+randomBytes(12).toString('hex')+'A1';
  user = await json(await admin('/api/admin/users', 'POST', { email: `gallery-${Date.now()}@example.test`, displayName: 'Gallery QA', role: 'WebPortalModerator', password }), 201);
  await json(await moderator('/api/admin/login', 'POST', { email: user.email, password }));
  const originals = await json(await admin('/api/admin/resorts'));
  for (const before of originals) {
    // Temporary tests use this resort's own existing image, never Bakuriani photos on other resorts.
    const oldUrl = before.en.gallery[0] || before.en.image;
    const bytes = oldUrl.startsWith('/media/') ? Buffer.from(await (await fetch(origin + oldUrl)).arrayBuffer()) : await readFile(new URL('../mtaprime/public' + oldUrl, import.meta.url));
    const body = new FormData(); body.set('file', new Blob([bytes], { type: 'image/jpeg' }), 'gallery-test.jpg');
    const upload = await json(await moderator('/api/admin/gallery-photo', 'POST', body));
    assert.equal(hash(Buffer.from(await (await fetch(origin + upload.url)).arrayBuffer())), hash(bytes));
    let current;
    try {
      const gallery = [oldUrl, upload.url];
      const draft = structuredClone(before);
      for (const lang of ['ka', 'en']) {
        draft[lang].gallery = gallery;
        draft[lang].galleryDetails = gallery.map((url, i) => ({ url, title: `${lang === 'ka' ? 'გალერეის შემოწმება' : 'Gallery verification'} ${i}`, category: i ? (lang === 'ka' ? 'აქტივობები' : 'Activities') : (lang === 'ka' ? 'ზამთარი' : 'Winter') }));
      }
      current = await json(await moderator(`/api/admin/resorts/${before.id}`, 'PUT', draft));
      assert.equal((await moderator(`/api/admin/resorts/${before.id}?version=${current.version}`, 'DELETE')).status, 403);
      assert.equal((await admin(`/api/admin/resorts/${before.id}`, 'PUT', draft)).status, 409);
      for (const locale of ['ka', 'en']) {
        const content = (await (await fetch(`${origin}/api/resorts?locale=${locale}`)).json()).find(r => r.id === before.id);
        assert.deepEqual(content.galleryDetails, current[locale].galleryDetails);
        const html = await (await fetch(`${site}/${locale}/resorts/${before.slug}`)).text();
        assert(html.includes(current[locale].galleryDetails[1].title)); assert(html.includes('srcSet='));
        const download = await fetch(`${site}/api/gallery/${before.slug}/1?locale=${locale}`);
        assert.equal(download.status, 200); assert(download.headers.get('content-disposition').includes('attachment'));
        const watermarked = Buffer.from(await download.arrayBuffer()); assert.notEqual(hash(watermarked), hash(bytes));
        const a = await sharp(bytes).metadata(), b = await sharp(watermarked).metadata();
        const swapped = a.orientation >= 5 && a.orientation <= 8;
        assert.equal(b.width, swapped ? a.height : a.width); assert.equal(b.height, swapped ? a.width : a.height);
        assert.equal(hash(Buffer.from(await (await fetch(origin + upload.url)).arrayBuffer())), hash(bytes));
      }
      const invalid = structuredClone(current); invalid.en.galleryDetails[0].title = '';
      assert.equal((await admin(`/api/admin/resorts/${before.id}`, 'PUT', invalid)).status, 400);
      const overflow = structuredClone(current); overflow.ka.gallery = Array(13).fill(oldUrl);
      assert.equal((await admin(`/api/admin/resorts/${before.id}`, 'PUT', overflow)).status, 400);
      for (const lang of ['ka', 'en']) { current[lang].gallery.reverse(); current[lang].galleryDetails.reverse(); }
      current = await json(await moderator(`/api/admin/resorts/${before.id}`, 'PUT', current));
      assert.equal(current.en.gallery[0], upload.url);
      for (const lang of ['ka', 'en']) { current[lang].gallery.pop(); current[lang].galleryDetails.pop(); }
      current = await json(await moderator(`/api/admin/resorts/${before.id}`, 'PUT', current));
      assert.equal(current.en.gallery.length, 1);
      console.log(`PASS ${before.slug}: original upload, bilingual save/refresh, metadata validation, order/removal, watermark dimensions, clean source, Moderator permissions, stale-save conflict`);
    } finally {
      if (current) {
        const fresh = (await json(await admin('/api/admin/resorts'))).find(r => r.id === before.id);
        const restored = await json(await admin(`/api/admin/resorts/${before.id}`, 'PUT', { ...before, version: fresh.version }));
        assert.deepEqual(restored.ka, before.ka); assert.deepEqual(restored.en, before.en);
      }
    }
  }
  assert.equal((await fetch(`${site}/api/gallery/bakuriani/99`)).status, 404);
  assert.equal((await fetch(`${site}/api/gallery/bakuriani/0?locale=fr`)).status, 404);
  const malformed = new FormData(); malformed.set('file', new Blob(['not an image']), 'bad.jpg');
  assert.equal((await admin('/api/admin/gallery-photo', 'POST', malformed)).status, 400);
  console.log('PASS: every resort restored; anonymous upload and malformed download/upload blocked.');
} finally {
  if (user) { const current = (await json(await admin('/api/admin/users'))).find(u => u.id === user.id); if (current) await admin(`/api/admin/users/${user.id}?version=${current.version}`, 'DELETE'); }
}
