import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const apiOrigin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const siteOrigin = process.env.TEST_SITE_ORIGIN || 'http://localhost:3100';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));
const cookies = new Map();
async function request(path, { method = 'GET', body, csrf = true, auth = true } = {}) {
  const headers = {};
  if (auth && method !== 'GET' && csrf) {
    const session = await request('/api/admin/session');
    headers['X-CSRF-TOKEN'] = (await session.json()).csrfToken;
  }
  if (auth) headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const response = await fetch(apiOrigin + path, { method, headers, body, redirect: 'manual' });
  if (auth) for (const value of response.headers.getSetCookie()) { const pair = value.split(';')[0]; const at = pair.indexOf('='); cookies.set(pair.slice(0, at), pair.slice(at + 1)); }
  return response;
}
const slug = `verification-${Date.now()}`;
let record;
const draft = { slug, date: '2026-09-22', image: '', gallery: [], titleKa: 'ავტომატური შემოწმება', excerptKa: '', contentKa: [], titleEn: '', excerptEn: '', contentEn: [], published: false, version: null };
try {
  assert.equal((await request('/api/admin/news', { auth: false })).status, 401);
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { email: credentials.AdminEmail, password: credentials.AdminPassword }, csrf: false })).status, 400);
  const login = await request('/api/admin/login', { method: 'POST', body: { email: credentials.AdminEmail, password: credentials.AdminPassword } });
  assert.equal(login.status, 200);
  assert.ok(login.headers.getSetCookie().some(x => /mta\.admin=.*httponly/i.test(x)));
  assert.equal((await request('/api/admin/news', { method: 'POST', body: draft, csrf: false })).status, 400);
  let response = await request('/api/admin/news', { method: 'POST', body: draft });
  assert.equal(response.status, 201); record = await response.json();
  assert.equal((await request(`/api/news/${slug}`)).status, 404);
  assert.ok(!(await (await request('/api/news')).json()).some(n => n.slug === slug));
  assert.equal((await request('/api/admin/news', { method: 'POST', body: draft })).status, 409);
  assert.equal((await request(`/api/admin/news/${record.id}`, { method: 'PUT', body: { ...record, published: true } })).status, 400);
  const badUpload = new FormData(); badUpload.set('file', new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/svg+xml' }), 'test.svg');
  assert.equal((await request('/api/admin/media', { method: 'POST', body: badUpload })).status, 400);
  const upload = new FormData(); upload.set('file', new Blob([await readFile(new URL('../mtaprime/public/news/Goderdzi1.jpg', import.meta.url))], { type: 'image/jpeg' }), 'photo.jpg');
  response = await request('/api/admin/media', { method: 'POST', body: upload }); assert.equal(response.status, 200);
  const image = (await response.json()).url;
  assert.equal((await request(image)).status, 200);
  const publish = { ...record, published: true, image, gallery: [image], excerptKa: 'შემოწმების აღწერა', contentKa: ['ქართული სრული ტექსტი <script>alert(1)</script>'], titleEn: 'Integration verification', excerptEn: 'Verification description', contentEn: ['English article body.'] };
  response = await request(`/api/admin/news/${record.id}`, { method: 'PUT', body: publish });
  assert.equal(response.status, 200); const oldVersion = record.version; record = await response.json();
  assert.equal((await request(`/api/admin/news/${record.id}`, { method: 'PUT', body: publish })).status, 409);
  assert.equal((await request(`/api/admin/news/${record.id}?version=${oldVersion}`, { method: 'DELETE' })).status, 409);
  assert.equal((await (await request(`/api/news/${slug}?locale=en`)).json()).title, 'Integration verification');
  const page = await fetch(`${siteOrigin}/ka/news/${slug}`); assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes('ავტომატური შემოწმება')); assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('rel="canonical"')); assert.ok(html.includes('name="description"'));
  assert.ok((await (await fetch(`${siteOrigin}/sitemap.xml`)).text()).includes(slug));
  assert.ok((await (await fetch(`${siteOrigin}/ka/news`)).text()).includes(slug));
  assert.equal((await fetch(`${siteOrigin}${image}`)).status, 200);
  response = await request(`/api/admin/news/${record.id}`, { method: 'PUT', body: { ...record, titleKa: 'განახლებული სატესტო ნიუსი' } });
  assert.equal(response.status, 200); record = await response.json();
  assert.ok((await (await fetch(`${siteOrigin}/ka/news/${slug}`)).text()).includes('განახლებული სატესტო ნიუსი'));
  response = await request(`/api/admin/news/${record.id}`, { method: 'PUT', body: { ...record, published: false } });
  assert.equal(response.status, 200); record = await response.json();
  assert.equal((await fetch(`${siteOrigin}/ka/news/${slug}`)).status, 404);
  assert.ok(!(await (await fetch(`${siteOrigin}/sitemap.xml`)).text()).includes(slug));
  assert.equal((await request(`/api/admin/news/${record.id}?version=${record.version}`, { method: 'DELETE' })).status, 204);
  record = null;
  assert.ok(!(await (await request('/api/admin/news')).json()).some(n => n.slug === slug));
  assert.equal((await request('/api/admin/logout', { method: 'POST' })).status, 204);
  assert.equal((await request('/api/admin/news')).status, 401);
  console.log('PASS: authentication, CSRF, private drafts, validation, duplicate slugs, image upload, concurrent edits, bilingual publication, HTML escaping, public SEO/sitemap, edits, unpublish, delete and logout.');
} finally {
  if (record) {
    const current = (await (await request('/api/admin/news')).json()).find(n => n.id === record.id);
    if (current) await request(`/api/admin/news/${current.id}?version=${current.version}`, { method: 'DELETE' });
  }
}
