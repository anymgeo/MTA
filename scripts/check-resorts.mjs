import assert from 'node:assert/strict';
import {canonicalTestTimes} from './canonical-test-times.mjs';
import { readFile } from 'node:fs/promises';
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const site = process.env.TEST_SITE_ORIGIN || 'http://localhost:3100';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));
const cookies = new Map();
async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
  headers.Cookie = [...cookies].map(([k,v]) => `${k}=${v}`).join('; ');
  if (body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const response = await fetch(origin + path, { method, body, headers, redirect: 'manual' });
  for (const value of response.headers.getSetCookie()) { const pair = value.split(';')[0]; const i = pair.indexOf('='); cookies.set(pair.slice(0,i),pair.slice(i+1)); }
  return response;
}
let resort;
try {
  assert.equal((await request('/api/admin/resorts')).status, 401);
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { email: credentials.AdminEmail, password: credentials.AdminPassword } })).status, 200);
  const list = await (await request('/api/admin/resorts')).json();
  assert.ok(list.length >= 1);
  const template = canonicalTestTimes(list[0]);
  const slug = `resort-check-${Date.now()}`;
  const content = { ...template, id: undefined, version: null, slug, status: 'CLOSED', ka: { ...template.ka, name: 'სატესტო კურორტი' }, en: { ...template.en, name: 'Verification resort' } };
  let response = await request('/api/admin/resorts', { method: 'POST', body: content });
  assert.equal(response.status, 201, await response.clone().text()); resort = await response.json();
  assert.equal((await request('/api/admin/resorts', { method: 'POST', body: content })).status, 409);
  assert.equal((await request('/api/admin/resorts', { method: 'POST', body: { ...content, slug: 'bad-check', ka: { ...content.ka, image: 'javascript:alert(1)' } } })).status, 400);
  assert.equal((await request('/api/admin/resorts', { method: 'POST', body: { ...content, slug: 'bad-check', ka: { ...content.ka, trailDifficulty: [{ label: 'Bad', description: '', value: 'invalid' }] } } })).status, 400);
  assert.equal((await (await request('/api/resorts?locale=en')).json()).find(r => r.slug === slug).name, 'Verification resort');
  for (const suffix of ['', '/maps', '/activities']) {
    const page = await fetch(`${site}/ka/resorts/${slug}${suffix}`);
    assert.equal(page.status, 200, `${suffix} public route`);
  }
  assert.ok((await (await fetch(`${site}/ka/resorts/${slug}`)).text()).includes('სატესტო კურორტი'));
  assert.ok((await (await fetch(`${site}/ka/resorts`)).text()).includes(slug));
  assert.ok((await (await fetch(`${site}/sitemap.xml`)).text()).includes(slug));
  const old = resort;
  response = await request(`/api/admin/resorts/${resort.id}`, { method: 'PUT', body: { ...resort, status: 'LIMITED', ka: { ...resort.ka, name: 'განახლებული კურორტი' } } });
  assert.equal(response.status, 200); resort = await response.json();
  assert.equal((await request(`/api/admin/resorts/${old.id}`, { method: 'PUT', body: old })).status, 409);
  assert.ok((await (await fetch(`${site}/ka/resorts/${slug}`)).text()).includes('განახლებული კურორტი'));
  assert.equal((await request(`/api/admin/resorts/${resort.id}?version=${resort.version}`, { method: 'DELETE' })).status, 204); resort = null;
  for (const suffix of ['', '/maps', '/activities']) assert.equal((await fetch(`${site}/ka/resorts/${slug}${suffix}`)).status, 404);
  assert.ok(!(await (await fetch(`${site}/sitemap.xml`)).text()).includes(slug));
  console.log('PASS: resort creation, validation, bilingual public data, detail/map/activity pages, sitemap, edit, concurrency and deletion.');
} finally {
  if (resort) await request(`/api/admin/resorts/${resort.id}?version=${resort.version}`, { method: 'DELETE' });
}
