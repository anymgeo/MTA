import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const sharp = createRequire(new URL('../mtaprime/package.json', import.meta.url))('sharp');

// Apply only to the existing local CMS. Production uses its separately reviewed
// public snapshot export. No deletes, schema resets, or direct database writes.
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Local CMS only');
const apply = process.argv.includes('--apply');
const folder = new URL('../.local/legacy-migration/', import.meta.url);
const { records } = JSON.parse(await readFile(new URL('source.json', folder)));
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url)));
const cookies = new Map();
async function api(route, method = 'GET', payload) {
  const headers = {};
  if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await api('/api/admin/session')).csrfToken;
  headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  let body = payload;
  if (payload && !(payload instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(payload); }
  const response = await fetch(origin + route, { method, headers, body, signal: AbortSignal.timeout(30000) });
  for (const cookie of response.headers.getSetCookie()) { const [pair] = cookie.split(';'); const i = pair.indexOf('='); cookies.set(pair.slice(0, i), pair.slice(i + 1)); }
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}
await api('/api/admin/login', 'POST', { email: credentials.AdminEmail, password: credentials.AdminPassword });
const existing = { presscenter: await api('/api/admin/news'), projects: await api('/api/admin/content/projects') };
await mkdir(folder, { recursive: true });
if (apply) await writeFile(new URL(`before-${Date.now()}.json`, folder), JSON.stringify(existing, null, 2));
let manifest = { media: {}, records: {} };
try { manifest = JSON.parse(await readFile(new URL('manifest.json', folder))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const persist = () => writeFile(new URL('manifest.json', folder), JSON.stringify(manifest, null, 2));
const normalize = s => String(s || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const slugOf = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// A repeated title is not sufficient to merge two different source articles.
// Resolve an older importer manifest collision in favour of the original slug.
for (const [url, entry] of Object.entries(manifest.records)) {
  const peers = Object.entries(manifest.records).filter(([, value]) => value.id === entry.id);
  if (peers.length > 1 && slugOf(new URL(url).pathname.split('/').at(-1)) !== entry.slug) delete manifest.records[url];
}
function walk(node, visit) { if (!node || typeof node !== 'object') return; visit(node); (node.children || []).forEach(child => walk(child, visit)); }
function linkUrl(value, source) { const url = new URL(value, source); if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) throw new Error('Unsafe source link'); return url.href; }
function inline(node, source, media) {
  if (node.type === 'text') { let text = node.text || ''; if (node.bold) text = `**${text}**`; if (node.italic) text = `*${text}*`; return text; }
  if (node.type === 'break') return '\n';
  if (node.type === 'img') return `![${String(node.caption || '').replace(/[\[\]]/g, '')}](${media[node.url] || node.url})`;
  const text = (node.children || []).map(n => inline(n, source, media)).join('');
  return node.type === 'a' ? `[${text || node.url}](${media[node.url] || linkUrl(node.url, source)})` : text;
}
function paragraphs(doc, source, media) {
  return doc.body.children.flatMap(node => {
    if (node.type === 'p' && node.children?.some(child => child.type === 'img')) {
      const output = []; let pending = '';
      for (const child of node.children) {
        if (child.type === 'img') { if (pending.trim()) output.push(pending.trim()); pending = ''; output.push(inline(child, source, media)); }
        else pending += inline(child, source, media);
      }
      if (pending.trim()) output.push(pending.trim());
      return output;
    }
    if (node.type === 'ul' || node.type === 'ol') return [(node.children || []).map((n, i) => `${node.type === 'ol' ? `${i + 1}.` : '-'} ${inline(n, source, media)}`).join('\n')];
    if (node.type === 'code_block') return ['```\n' + inline(node, source, media) + '\n```'];
    const text = inline(node, source, media).trim();
    if (!text) return [];
    return [/^h[1-6]$/.test(node.type) ? '#'.repeat(Number(node.type[1])) + ' ' + text : text];
  });
}
async function upload(sourceUrl) {
  if (manifest.media[sourceUrl]) {
    const response = await fetch(origin + manifest.media[sourceUrl]);
    if (!response.ok) throw new Error(`Previously imported media missing: ${sourceUrl}`);
    return manifest.media[sourceUrl];
  }
  const url = new URL(sourceUrl, 'https://mta.ski');
  if (url.protocol !== 'https:' || !['assets.tina.io', 'mta.ski'].includes(url.hostname)) throw new Error(`Media host needs review: ${url.hostname}`);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Media download ${response.status}: ${url}`);
  let bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 45 * 1024 * 1024) throw new Error('Oversized legacy media');
  const pdf = bytes.subarray(0, 5).toString() === '%PDF-';
  let type = pdf ? 'application/pdf' : 'image/jpeg', name = pdf ? 'legacy.pdf' : 'legacy.jpg';
  if (!pdf) {
    const meta = await sharp(bytes, { limitInputPixels: 64000000 }).metadata();
    if (['jpeg', 'png', 'webp'].includes(meta.format) && bytes.length <= 5 * 1024 * 1024) { type = 'image/' + meta.format; name = 'legacy.' + (meta.format === 'jpeg' ? 'jpg' : meta.format); }
    else bytes = await sharp(bytes, { limitInputPixels: 64000000 }).rotate().resize({ width: 3200, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  }
  if (bytes.length > 5 * 1024 * 1024) throw new Error('Media exceeds existing CMS upload limit');
  const form = new FormData(); form.set('file', new Blob([bytes], { type }), name);
  const result = await api(pdf ? '/api/admin/resort-pdf' : '/api/admin/media', 'POST', form);
  manifest.media[sourceUrl] = result.url; await persist(); return result.url;
}
const results = [];
for (const record of records) {
  const { module, document: ka, translation: translated, sourceUrl } = record;
  const en = translated || ka;
  const oldId = manifest.records[sourceUrl]?.id;
  const projectSlugs = { new_gudauri: 'gudauri-2-new-lifts', bakurianitrails: 'bakuriani-trails', bakurianisnowmaking: 'bakuriani-snowmaking', bakurianilake: 'bakuriani-artificial-water-reservoirs', Bakuriani3NewLifts: 'bakuriani-3-new-lifts', newsvanetilift: 'zuruldi-ski-lift' };
  const canonical = module === 'projects' && existing.projects.find(item => item.slug === projectSlugs[ka._sys.filename]);
  const duplicate = canonical && existing.projects.find(item => item.id === oldId && item.id !== canonical.id);
  const matches = canonical ? [canonical] : existing[module].filter(item => item.id === oldId || item.slug === slugOf(ka._sys.filename) ||
    (module === 'presscenter' ? item.contentKa?.some(x => x === sourceUrl || x.includes(`(${sourceUrl})`)) || (normalize(item.titleKa) === normalize(ka.title) && item.date === ka.date.slice(0, 10) && !item.contentKa?.some(x => /https:\/\/mta\.ski\/(?:ge|en)\/presscenter\//.test(x)))
      : normalize(JSON.parse(item.kaJson).title) === normalize(ka.title) || JSON.parse(item.kaJson).sourceUrl === sourceUrl));
  if (matches.length > 1) throw new Error(`Ambiguous duplicate match: ${sourceUrl}`);
  const before = matches[0], slug = before?.slug || slugOf(ka._sys.filename);
  const digest = createHash('sha256').update('import-v4:' + JSON.stringify(record)).digest('hex');
  if (manifest.records[sourceUrl]?.digest === digest && before && before.id === oldId) { results.push({ sourceUrl, slug, action: 'unchanged' }); continue; }
  const urls = new Set([ka.image, en.image].filter(Boolean));
  for (const doc of [ka, en]) walk(doc.body, node => { if (node.type === 'img' || (node.type === 'a' && /\.pdf(?:[?#]|$)/i.test(node.url))) urls.add(node.url); });
  if (!apply) { results.push({ sourceUrl, slug, action: before ? 'update' : 'create', media: urls.size, englishAvailable: !!translated }); continue; }
  const media = {};
  for (const url of urls) media[url] = await upload(url);
  let payload;
  if (module === 'presscenter') {
    // The legacy website prints this UTC calendar day (verified against its HTML).
    const date = ka.date.slice(0, 10);
    payload = { slug, date, image: media[ka.image], category: before?.category || 'news', gallery: [...urls].filter(url => /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url)).map(url => media[url]).filter(url => url !== media[ka.image]), published: before?.published ?? !ka.draft, version: before?.version };
    for (const [locale, doc] of [['Ka', ka], ['En', en]]) {
      const content = paragraphs(doc, sourceUrl, media);
      if (locale === 'En' && !translated) content.unshift('English translation is not available on the source website. The original Georgian article is preserved below.');
      payload['title' + locale] = doc.title.trim();
      payload['excerpt' + locale] = (doc.description || content.find(x => !x.startsWith('!')) || doc.title).slice(0, 600);
      const localizedSource = locale === 'En' && translated ? `https://mta.ski/en/presscenter/${doc._sys.filename}` : sourceUrl;
      const originalDate = locale === 'En' && translated && doc.date?.slice(0, 10) !== date ? [`Original English publication date: ${doc.date.slice(0, 10)}`] : [];
      payload['content' + locale] = [...content, ...originalDate, `[mta.ski](${localizedSource})`];
    }
    if (payload.gallery.length > 12) throw new Error(`Gallery needs reviewed limit extension: ${sourceUrl}`);
  } else {
    const resortId = /გუდაურ|gudauri/i.test(ka.title) ? 'gudauri-kobi' : /ბაკურიან|bakuriani/i.test(ka.title) ? 'bakuriani' : /სვანეთ|მესტი|svaneti|mestia/i.test(ka.title) ? 'mestia' : 'all';
    const names = { 'gudauri-kobi': ['გუდაური', 'Gudauri'], bakuriani: ['ბაკურიანი', 'Bakuriani'], mestia: ['მესტია', 'Mestia'], all: ['საქართველო', 'Georgia'] };
    const localized = (doc, index, previous) => ({ ...previous, title: doc.title.trim(), description: doc.description || '', overview: doc.description || '', image: media[doc.image], date: '', datePrecision: 'year', year: Number(String(doc.year).slice(0, 4)), sourceYear: doc.year, resortId, resort: names[resortId][index], category: previous?.category || (index ? 'Infrastructure' : 'ინფრასტრუქტურა'), sourceUrl, sourceLanguage: translated || index === 0 ? (index ? 'en' : 'ka') : 'ka', blocks: paragraphs(doc, sourceUrl, media).map(text => ({ title: '', text })), gallery: [...urls].filter(url => /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url)).map(url => media[url]).filter(url => url !== media[doc.image]), activities: previous?.activities || [], highlights: previous?.highlights || [], stats: previous?.stats || [], files: previous?.files || [], links: [{ label: 'mta.ski', url: sourceUrl }], status: previous?.status || 'unknown' });
    payload = { slug, published: before?.published ?? !ka.draft, sortOrder: before?.sortOrder ?? existing.projects.length + results.length, version: before?.version, ka: localized(ka, 0, before ? JSON.parse(before.kaJson) : {}), en: localized(en, 1, before ? JSON.parse(before.enJson) : {}) };
  }
  const route = module === 'presscenter' ? '/api/admin/news' : '/api/admin/content/projects';
  const saved = await api(route + (before ? '/' + before.id : ''), before ? 'PUT' : 'POST', payload);
  manifest.records[sourceUrl] = { id: saved.id, slug, digest, englishAvailable: !!translated }; await persist();
  // Only soft-delete an accidental duplicate created by this importer, after
  // preserving the original project URL, merging its source copy, and backing up.
  if (duplicate) {
    if (JSON.parse(duplicate.kaJson).sourceUrl !== sourceUrl) throw new Error('Refusing unrelated duplicate cleanup');
    await api(`/api/admin/content/projects/${duplicate.id}?version=${duplicate.version}`, 'DELETE');
    existing.projects = existing.projects.filter(item => item.id !== duplicate.id);
    console.log(`SOFT-DELETED importer duplicate ${duplicate.slug}; retained ${slug}`);
  }
  existing[module] = [...existing[module].filter(x => x.id !== saved.id), saved];
  results.push({ sourceUrl, slug, action: before ? 'updated' : 'created', englishAvailable: !!translated });
  console.log(`${before ? 'UPDATED' : 'CREATED'} ${module}/${slug}`);
}
await writeFile(new URL(apply ? 'result.json' : 'plan.json', folder), JSON.stringify(results, null, 2));
if (apply && new Set(records.map(record => manifest.records[record.sourceUrl]?.id)).size !== records.length) throw new Error('Source identities must map to distinct CMS records');
console.log(JSON.stringify({ apply, total: results.length, counts: results.reduce((a, r) => ({ ...a, [r.action]: (a[r.action] || 0) + 1 }), {}) }));
