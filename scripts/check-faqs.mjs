import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));
function client() {
  const cookies = new Map();
  return async function request(path, { method = 'GET', body, csrf = true } = {}) {
    const headers = {};
    if (method !== 'GET' && csrf) headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
    headers.Cookie = [...cookies].map(([k,v]) => k + '=' + v).join('; ');
    if (body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(origin + path, { method, body, headers, redirect: 'manual' });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0], i = pair.indexOf('=');
      cookies.set(pair.slice(0,i), pair.slice(i+1));
    }
    return response;
  };
}
const admin = client(), moderator = client();
const publicRows = async (locale = 'en', scope = '') => (await fetch(origin + '/api/faqs?locale=' + locale + '&scope=' + scope)).json();
const created = new Set();
let user;
try {
  assert.equal((await admin('/api/admin/faqs')).status, 401);
  assert.equal((await admin('/api/admin/login', { method: 'POST', body: { email: credentials.AdminEmail, password: credentials.AdminPassword } })).status, 200);
  const initial = await (await admin('/api/admin/faqs')).json();
  assert.equal(initial.filter(r => r.id.startsWith('fa000000-')).length, 34);
  for (const locale of ['ka', 'en']) {
    const general = await publicRows(locale);
    assert.equal(general.filter(r => r.id.startsWith('fa000000-')).length, 14);
    for (const scope of ['bakuriani','gudauri-kobi','mestia','goderdzi']) {
      const rows = await publicRows(locale, scope);
      assert.equal(rows.filter(r => r.id.startsWith('fa000000-')).length, 5);
      assert.ok(rows.every(r => r.question && r.answer && !r.answer.includes('{value0}')));
    }
  }
  assert.equal((await fetch(origin + '/api/faqs?locale=invalid')).status, 400);
  const password = 'FaqCheck!Aa1' + randomBytes(12).toString('hex');
  let response = await admin('/api/admin/users', { method: 'POST', body: {
    email: 'faq-check-' + Date.now() + '@example.test', displayName: 'Temporary FAQ verification',
    role: 'WebPortalModerator', password,
  } });
  assert.equal(response.status, 201); user = await response.json();
  assert.equal((await moderator('/api/admin/login', { method: 'POST', body: { email: user.email, password } })).status, 200);
  for (const request of [admin, moderator]) {
    const input = { scope: '', categoryKa: '', categoryEn: '', questionKa: 'ტესტი კითხვა', answerKa: 'ტესტი პასუხი',
      questionEn: 'FAQ verification question', answerEn: 'FAQ verification answer', sortOrder: 999999, published: false };
    assert.equal((await request('/api/admin/faqs', { method: 'POST', csrf: false, body: input })).status, 400);
    assert.equal((await request('/api/admin/faqs', { method: 'POST', body: { ...input, answerKa: '' } })).status, 400);
    assert.equal((await request('/api/admin/faqs', { method: 'POST', body: { ...input, scope: 'not-a-resort' } })).status, 400);
    response = await request('/api/admin/faqs', { method: 'POST', body: input });
    assert.equal(response.status, 201); let row = await response.json(); created.add(row.id);
    assert.ok(!(await publicRows()).some(f => f.id === row.id));
    const stale = row.version;
    response = await request('/api/admin/faqs/' + row.id, { method: 'PUT', body: { ...row, published: true } });
    assert.equal(response.status, 200); row = await response.json();
    assert.equal((await publicRows()).at(-1).id, row.id);
    assert.equal((await publicRows('ka')).find(f => f.id === row.id).answer, input.answerKa);
    assert.equal((await publicRows('en')).find(f => f.id === row.id).answer, input.answerEn);
    assert.equal((await request('/api/admin/faqs/' + row.id, { method: 'PUT', body: { ...row, version: stale } })).status, 409);
    assert.equal((await request('/api/admin/faqs/' + row.id + '?version=' + stale, { method: 'DELETE' })).status, 409);
    response = await request('/api/admin/faqs/' + row.id, { method: 'PUT', body: { ...row, sortOrder: 1, answerEn: 'Edited answer' } });
    row = await response.json(); assert.equal(row.sortOrder, 1);
    assert.equal((await publicRows())[1].id, row.id);
    response = await request('/api/admin/faqs/' + row.id, { method: 'PUT', body: { ...row, published: false } });
    row = await response.json(); assert.ok(!(await publicRows()).some(f => f.id === row.id));
    assert.equal((await request('/api/admin/faqs/' + row.id + '?version=' + row.version, { method: 'DELETE' })).status, 204);
    created.delete(row.id);
  }
  console.log('PASS: 34 migrated bilingual FAQs, scoped publication, Admin + Moderator CRUD, ordering, validation, CSRF, private drafts and edit/delete concurrency.');
  if (process.env.FAQ_BROWSER_VERIFY === '1') {
    // Disposable local moderator only; production credentials are never printed.
    console.log(JSON.stringify({ email: user.email, password }));
    console.log('Press Enter after browser verification to remove the temporary account.');
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    process.stdin.pause();
  }
} finally {
  const rows = await (await admin('/api/admin/faqs')).json();
  for (const row of rows.filter(r => created.has(r.id))) await admin('/api/admin/faqs/' + row.id + '?version=' + row.version, { method: 'DELETE' });
  if (user) {
    const users = await (await admin('/api/admin/users')).json();
    const current = users.find(u => u.id === user.id);
    if (current) assert.equal((await admin('/api/admin/users/' + current.id + '?version=' + current.version, { method: 'DELETE' })).status, 204);
  }
}
