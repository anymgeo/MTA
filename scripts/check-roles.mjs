import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));
function client() {
  const cookies = new Map();
  async function request(path, { method = 'GET', body, csrf = true } = {}) {
    const headers = {};
    if (method !== 'GET' && csrf) headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
    headers.Cookie = [...cookies].map(([k,v]) => `${k}=${v}`).join('; ');
    if (body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(origin + path, { method, body, headers, redirect: 'manual' });
    for (const value of response.headers.getSetCookie()) { const pair = value.split(';')[0]; const i = pair.indexOf('='); cookies.set(pair.slice(0,i), pair.slice(i+1)); }
    return response;
  }
  return request;
}
const admin = client(), moderator = client(), promoted = client();
const stamp = Date.now();
const password = 'Verify!' + randomBytes(12).toString('hex') + 'A1';
const created = [];
let news;
let resort;
async function login(request, email, pass = password) {
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { email, password: pass } })).status, 200);
}
async function users() { return (await admin('/api/admin/users')).json(); }
async function current(id) { return (await users()).find(x => x.id === id); }
async function add(role, suffix) {
  const response = await admin('/api/admin/users', { method: 'POST', body: { email: `verify-${stamp}-${suffix}@example.test`, displayName: 'Verification account', role, password } });
  assert.equal(response.status, 201); const user = await response.json(); created.push(user.id); return user;
}
try {
  assert.equal((await moderator('/api/admin/users')).status, 401);
  await login(admin, credentials.AdminEmail, credentials.AdminPassword);
  const session = await (await admin('/api/admin/session')).json();
  assert.equal(session.role, 'WebPortalAdmin'); assert.equal(session.email, 'd.gabelaia@mta.ski');
  assert.ok((await users()).every(u => !('passwordHash' in u) && !('securityStamp' in u)));
  let mod = await add('WebPortalModerator', 'mod');
  const peer = await add('WebPortalAdmin', 'super');
  await login(moderator, mod.email);
  assert.equal((await (await moderator('/api/admin/session')).json()).role, 'WebPortalModerator');
  assert.equal((await moderator('/api/admin/users')).status, 200);
  assert.equal((await moderator('/api/admin/users', { method: 'POST', body: { ...peer, email: `forbidden-${stamp}@example.test`, password } })).status, 403);
  assert.equal((await moderator(`/api/admin/users/${peer.id}?version=${peer.version}`, { method: 'DELETE' })).status, 403);
  assert.equal((await moderator(`/api/admin/users/${mod.id}`, { method: 'PUT', body: { ...mod, role: 'WebPortalAdmin' } })).status, 403);
  assert.equal((await moderator(`/api/admin/users/${peer.id}`, { method: 'PUT', body: { ...peer, password } })).status, 403);
  let response = await moderator(`/api/admin/users/${peer.id}`, { method: 'PUT', body: { ...peer, displayName: 'Edited by moderator' } });
  assert.equal(response.status, 200);
  assert.equal((await current(peer.id)).displayName, 'Edited by moderator');
  response = await moderator(`/api/admin/users/${mod.id}`, { method: 'PUT', body: { ...mod, displayName: 'Moderator updated' } });
  assert.equal(response.status, 200); mod = await response.json();
  assert.equal((await moderator(`/api/admin/users/${mod.id}`, { method: 'PUT', body: { ...mod, password, currentPassword: 'incorrect' } })).status, 400);
  assert.equal((await admin(`/api/admin/users/${mod.id}`, { method: 'PUT', body: { ...mod, version: 'stale-version' } })).status, 409);
  const article = { slug: `role-test-${stamp}`, date: '2026-09-22', category: 'news', titleKa: 'როლების სატესტო ნიუსი', titleEn: 'Role test', excerptKa: 'შემოწმება', excerptEn: 'Test', contentKa: ['სატესტო ტექსტი'], contentEn: ['Test body'], image: '/news/Goderdzi1.jpg', gallery: [], published: true };
  response = await moderator('/api/admin/news', { method: 'POST', body: article }); assert.equal(response.status, 201); news = await response.json();
  response = await moderator(`/api/admin/news/${news.id}`, { method: 'PUT', body: { ...news, titleKa: 'მოდერატორის განახლება' } }); assert.equal(response.status, 200); news = await response.json();
  assert.equal((await moderator(`/api/admin/news/${news.id}?version=${news.version}`, { method: 'DELETE' })).status, 204); news = null;
  const resorts = await (await moderator('/api/admin/resorts')).json();
  const resortInput = structuredClone(resorts[0]);
  for (const locale of ['ka', 'en']) {
    if (resortInput[locale].page?.travelTimes) resortInput[locale].page.travelTimes = resortInput[locale].page.travelTimes.map(row => ({ ...row, time: '60 min' }));
  }
  response = await moderator('/api/admin/resorts', { method: 'POST', body: { ...resortInput, slug: `mod-resort-${stamp}`, version: null } });
  assert.equal(response.status, 201); resort = await response.json();
  response = await moderator(`/api/admin/resorts/${resort.id}`, { method: 'PUT', body: { ...resort, status: 'CLOSED' } });
  assert.equal(response.status, 200); resort = await response.json();
  assert.equal((await moderator(`/api/admin/resorts/${resort.id}?version=${resort.version}`, { method: 'DELETE' })).status, 403);
  // Super Admin can promote/demote, and old moderator sessions are revoked immediately.
  response = await admin(`/api/admin/users/${mod.id}`, { method: 'PUT', body: { ...await current(mod.id), role: 'WebPortalAdmin' } }); assert.equal(response.status, 200);
  assert.equal((await moderator('/api/admin/users')).status, 401);
  await login(promoted, mod.email);
  assert.equal((await (await promoted('/api/admin/session')).json()).role, 'WebPortalAdmin');
  response = await admin(`/api/admin/users/${mod.id}`, { method: 'PUT', body: { ...await current(mod.id), role: 'WebPortalModerator' } }); assert.equal(response.status, 200);
  assert.equal((await promoted('/api/admin/users')).status, 401);
  const existingPeer = await current(peer.id);
  assert.equal((await admin(`/api/admin/users/${peer.id}?version=${existingPeer.version}`, { method: 'DELETE' })).status, 204);
  assert.equal((await admin('/api/admin/users', { method: 'POST', body: { email: 'invalid', displayName: '', password: 'weak', role: 'Admin' } })).status, 400);
  console.log('PASS: Super Admin login, add/edit/delete users; Moderator view/edit users and create/edit news/resorts; forbidden user/resort deletion; blocked role escalation and password takeover; conflict handling; immediate session revocation on role changes.');
} finally {
  for (const id of created) {
    const user = await current(id);
    if (user) await admin(`/api/admin/users/${id}?version=${user.version}`, { method: 'DELETE' });
  }
  if (news) await admin(`/api/admin/news/${news.id}?version=${news.version}`, { method: 'DELETE' });
  if (resort) await admin(`/api/admin/resorts/${resort.id}?version=${resort.version}`, { method: 'DELETE' });
}
