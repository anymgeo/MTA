import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const origin = process.env.TEST_SITE_ORIGIN || 'http://127.0.0.1:3102';
const snapshot = JSON.parse(await readFile(new URL('../mtaprime/src/data/published-snapshot.json', import.meta.url)));
async function get(route, status = 200) {
  const response = await fetch(origin + route, {signal: AbortSignal.timeout(60000)});
  assert.equal(response.status, status, route);
  return response;
}
for (const locale of ['ka', 'en']) {
  await get('/' + locale + '/today');
  for (const article of snapshot.responses['news?locale=' + locale]) await get('/' + locale + '/news/' + article.slug);
  const home = await (await get('/' + locale)).text();
  assert(!/>04 MIN<|>04 წუთი</.test(home), 'No false live timestamp');
  assert(!home.includes('http://127.0.0.1:5100'), 'No local API in public markup');
}
assert.deepEqual(await (await get('/api/resort-conditions')).json(), []);
assert.equal((await fetch(origin + '/api/contact', {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status, 503);
for (const slug of ['bakuriani', 'gudauri-kobi', 'mestia', 'goderdzi']) {
  const resort = snapshot.responses['resorts?locale=en'].find(r => r.slug === slug);
  const source = resort.gallery?.[0] || resort.image;
  const original = Buffer.from(await (await get(source)).arrayBuffer());
  const downloaded = await get('/api/gallery/' + slug + '/0?locale=en');
  assert(downloaded.headers.get('content-disposition').includes('attachment'));
  assert.equal(downloaded.headers.get('content-type'), 'image/jpeg');
  const marked = Buffer.from(await downloaded.arrayBuffer());
  assert(!marked.equals(original), 'Download differs from clean source');
  assert(Buffer.from(await (await get(source)).arrayBuffer()).equals(original), 'Source unchanged after download');
  console.log('PASS', slug, 'watermarked download; clean source unchanged');
}
for (const asset of snapshot.assets) {
  const bytes = Buffer.from(await (await get(asset.url)).arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.url);
}
const asset = snapshot.assets.find(a => /\.jpg$/i.test(a.url));
await get('/_next/image?url=' + encodeURIComponent(asset.url) + '&w=640&q=75');
await get('/_next/image?url=' + encodeURIComponent(asset.url) + '&w=1920&q=75');
console.log(`PASS snapshot: bilingual news/today, contact safeguard, all 4 downloads, ${snapshot.assets.length} original hashes, responsive image optimization`);
