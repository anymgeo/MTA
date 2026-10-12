import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const folder = new URL('../.local/legacy-migration/', import.meta.url);
const { records } = JSON.parse(await readFile(new URL('source.json', folder)));
const manifest = JSON.parse(await readFile(new URL('manifest.json', folder)));
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const site = process.env.TEST_SITE_ORIGIN;
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url)));
const jar = new Map();
async function get(route) {
  const response = await fetch(origin + route, { headers: { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join('; ') } });
  for (const cookie of response.headers.getSetCookie()) { const pair = cookie.split(';')[0], i = pair.indexOf('='); jar.set(pair.slice(0,i),pair.slice(i+1)); }
  assert.equal(response.status, 200, route); return response.json();
}
const token = (await get('/api/admin/session')).csrfToken;
const login = await fetch(origin + '/api/admin/login', { method: 'POST', headers: { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join('; '), 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token }, body: JSON.stringify({ email: credentials.AdminEmail, password: credentials.AdminPassword }) });
assert.equal(login.status, 200);
for (const cookie of login.headers.getSetCookie()) { const pair = cookie.split(';')[0], i = pair.indexOf('='); jar.set(pair.slice(0,i),pair.slice(i+1)); }
const admin = { presscenter: await get('/api/admin/news'), projects: await get('/api/admin/content/projects') };
assert.equal(new Set(records.map(r => manifest.records[r.sourceUrl].id)).size, 59, 'Distinct source identities');
for (const { module, document, sourceUrl } of records) {
  const imported = manifest.records[sourceUrl];
  const saved = admin[module].find(x => x.id === imported.id); assert(saved, 'Visible in Admin ' + sourceUrl);
  const ka = module === 'projects' ? JSON.parse(saved.kaJson) : saved;
  assert.equal(module === 'projects' ? ka.title : ka.titleKa, document.title.trim());
  const body = (module === 'projects' ? ka.blocks.map(x => x.text) : ka.contentKa).join('\n').replace(/\*/g, '');
  function walk(node) {
    if (node.type === 'text' && node.text.trim()) assert(body.includes(node.text.trim().replace(/\*/g, '')), `Full text preserved: ${sourceUrl}`);
    if (node.type === 'img') assert(manifest.media[node.url], 'Image migrated');
    for (const child of node.children || []) walk(child);
  }
  walk(document.body);
  if (module === 'presscenter') assert.equal(ka.date, document.date.slice(0,10), 'Original visible publication day');
  else { assert.equal(ka.date, ''); assert.equal(ka.sourceYear, document.year); }
  const route = module === 'presscenter' ? `/api/news/${imported.slug}?locale=ka` : '/api/content/projects?locale=ka';
  const publicData = await get(route); assert(module === 'presscenter' ? publicData.slug === imported.slug : publicData.some(x => x.slug === imported.slug));
  if (site) for (const locale of ['ka','en']) {
    const response = await fetch(`${site}/${locale}/${module === 'presscenter' ? 'news' : 'projects'}/${imported.slug}`);
    assert.equal(response.status, 200); const html = await response.text();
    assert(!html.includes('Internal Server Error')); assert(html.includes('rel="canonical"'));
  }
}
for (const media of Object.values(manifest.media)) assert.equal((await fetch(origin + media)).status, 200, media);
assert.equal((await fetch(origin + '/api/admin/news')).status, 401, 'Admin remains protected');
console.log(`PASS: ${records.length} source records in Admin/public API; complete Georgian body, original dates/years, distinct IDs, ${Object.keys(manifest.media).length} accessible migrated media, protected Admin${site ? ', 118 bilingual detail pages' : ''}`);
