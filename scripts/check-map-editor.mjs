import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));

function client() {
  const cookies = new Map();
  async function request(path, { method = 'GET', body, csrf = true } = {}) {
    const headers = {};
    if (method !== 'GET' && csrf) headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
    headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    if (body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(origin + path, { method, body, headers, redirect: 'manual' });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0]; const split = pair.indexOf('='); cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return response;
  }
  return request;
}

async function login(request, email, password) {
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { email, password } })).status, 200);
}

const admin = client();
const moderator = client();
const password = `Verify!${randomBytes(12).toString('hex')}A1`;
const email = `map-editor-${Date.now()}@example.test`;
let user;
let feature;

try {
  await login(admin, credentials.AdminEmail, credentials.AdminPassword);
  let response = await admin('/api/admin/users', { method: 'POST', body: { email, displayName: 'Map verification moderator', role: 'WebPortalModerator', password } });
  assert.equal(response.status, 201); user = await response.json();
  await login(moderator, email, password);

  const resorts = await (await admin('/api/admin/resorts')).json();
  const resort = resorts.find(item => item.slug === 'bakuriani');
  assert.ok(resort, 'Bakuriani exists');
  let map = await (await moderator(`/api/admin/resorts/${resort.id}/map`)).json();
  const staleVersion = map.version;
  const payload = {
    mapVersion: map.version, version: null, typeKey: 'trail', points: [[100, 100], [220, 180]],
    nameKa: 'ტესტ ტრასა', nameEn: 'Verification trail', descriptionKa: '', descriptionEn: '',
    status: 'open', difficulty: 'easy', liftType: '', opens: '', closes: '', durationMinutes: null,
  };
  response = await moderator(`/api/admin/maps/${map.id}/features`, { method: 'POST', body: payload });
  assert.equal(response.status, 200); map = await response.json(); feature = map.features.find(item => item.nameEn === payload.nameEn);
  assert.ok(feature?.createdByName && feature?.createdAt, 'Audit creator recorded');

  const publicMap = await (await admin('/api/maps/bakuriani?locale=en')).json();
  assert.ok(publicMap.managed && publicMap.features.some(item => item.id === feature.id), 'Save is immediately public');

  response = await moderator(`/api/admin/maps/${map.id}/features/${feature.id}`, { method: 'PUT', body: { ...payload, mapVersion: staleVersion, version: feature.version } });
  assert.equal(response.status, 409, 'Stale map save is rejected');
  response = await moderator(`/api/admin/maps/${map.id}/features/${feature.id}?mapVersion=${map.version}&version=${feature.version}`, { method: 'DELETE' });
  assert.equal(response.status, 403, 'Moderator cannot delete');

  const curvedPoints = [[100, 100, 80, 100, 120, 100], [160, 135, 140, 120, 180, 150], [220, 180]];
  response = await moderator(`/api/admin/maps/${map.id}/features/${feature.id}`, { method: 'PUT', body: { ...payload, mapVersion: map.version, version: feature.version, points: curvedPoints } });
  assert.equal(response.status, 200); map = await response.json(); feature = map.features.find(item => item.id === feature.id);
  assert.equal(feature.points.length, 3, 'Vertices persist after edit');
  assert.deepEqual(feature.points, curvedPoints, 'Bezier control handles persist without a schema migration');
  const history = await (await moderator(`/api/admin/maps/${map.id}/history?featureId=${feature.id}`)).json();
  assert.deepEqual(history.map(item => item.action).slice(0, 2), ['edit', 'create']);

  response = await moderator(`/api/admin/maps/${map.id}/features`, { method: 'POST', body: { ...payload, mapVersion: map.version, points: [[1, 1]], nameEn: 'Invalid one-point trail' } });
  assert.equal(response.status, 400, 'A line requires two points');
  response = await moderator(`/api/admin/maps/${map.id}/features`, { method: 'POST', body: { ...payload, mapVersion: map.version, opens: '9am-ish', closes: '17:00' } });
  assert.equal(response.status, 400, 'Time dropdown values are enforced server-side');

  response = await admin(`/api/admin/maps/${map.id}/features/${feature.id}?mapVersion=${map.version}&version=${feature.version}`, { method: 'DELETE' });
  assert.equal(response.status, 200); feature = null;
  console.log('PASS: visual-map API, fixed coordinates and Bezier handles, save-is-live, audit history, concurrency conflict, point validation, server-side dropdown validation, and moderator delete restriction.');
} finally {
  if (feature) {
    const resorts = await (await admin('/api/admin/resorts')).json();
    const resort = resorts.find(item => item.slug === 'bakuriani');
    const map = await (await admin(`/api/admin/resorts/${resort.id}/map`)).json();
    const current = map.features.find(item => item.id === feature.id);
    if (current) await admin(`/api/admin/maps/${map.id}/features/${current.id}?mapVersion=${map.version}&version=${current.version}`, { method: 'DELETE' });
  }
  if (user) {
    const users = await (await admin('/api/admin/users')).json();
    const current = users.find(item => item.id === user.id);
    if (current) await admin(`/api/admin/users/${current.id}?version=${current.version}`, { method: 'DELETE' });
  }
}
