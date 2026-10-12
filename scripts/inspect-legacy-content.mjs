import { mkdir, writeFile, readFile } from 'node:fs/promises';

// Read the old site's serialized CMS data without executing its JavaScript.
// The complete source AST is retained for auditing and formatting preservation.
const root = new URL('../.local/legacy-migration/', import.meta.url);
await mkdir(root, { recursive: true });
export async function source(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = await response.text();
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map(m => JSON.parse(m[1])).join('');
  const rows = [];
  for (const line of chunks.split('\n')) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    try { rows.push(JSON.parse(line.slice(colon + 1))); } catch { /* RSC imports / lengths are not CMS JSON. */ }
  }
  const data = rows.find(row => Array.isArray(row) && row[3]?.data)?.[3]?.data;
  return { url, data, html, rows };
}
const records = [];
const matchCache = process.argv.includes('--match-cache');
const cached = process.argv.includes('--translations') || matchCache ? JSON.parse(await readFile(new URL('source.json', root))).records : [];
function documents(value, found = new Map()) {
  if (!value || typeof value !== 'object') return found;
  if (value._sys?.path && value.body?.type === 'root') found.set(value._sys.path, value);
  for (const child of Object.values(value)) documents(child, found);
  return found;
}
for (const module of ['presscenter', 'projects']) {
  const listing = matchCache ? { rows: [], html: '' } : await source(`https://mta.ski/ge/${module}`);
  const english = matchCache ? { rows: JSON.parse(await readFile(new URL(`${module}-english.json`, root))), html: '' } : await source(`https://mta.ski/en/${module}`);
  const allDocuments = documents(listing.rows);
  const englishDocuments = documents(english.rows);
  for (const url of new Set([...english.html.matchAll(/href="(\/en\/(?:presscenter|projects)\/[^"?#]+)"/g)].map(m => 'https://mta.ski' + m[1]))) {
    const page = await source(url);
    for (const doc of documents(page.rows).values()) englishDocuments.set(doc._sys.path, doc);
  }
  const translations = [...englishDocuments.values()].filter(x => x._sys.path.startsWith(`content/${module}/en/`));
  await writeFile(new URL(`${module}-english.json`, root), JSON.stringify(translations, null, 2));
  const urls = [...new Set([...listing.html.matchAll(/href="(\/ge\/(?:presscenter|projects)\/[^"?#]+)"/g)].map(m => 'https://mta.ski' + m[1]))];
  console.log(`${module}: ${urls.length} discovered detail pages`);
  for (const url of cached.length ? [] : urls) {
    const page = await source(url);
    const document = Object.values(page.data || {}).find(value => value?.body && value?._sys);
    if (!document) throw new Error(`Missing article/project: ${url}`);
    allDocuments.set(document._sys.path, document);
    console.log(`READ ${module} ${document._sys.filename}`);
  }
  for (const item of cached.filter(x => x.module === module)) allDocuments.set(item.document._sys.path, item.document);
  for (const document of allDocuments.values()) {
    if (!document._sys.path.startsWith(`content/${module}/ge/`)) continue;
    const aliases = { new_gudauri: 'gudauri2newlifts', bakuriani3newlifts: 'bakuriani3lifts' };
    const stem = name => aliases[name.toLowerCase()] || name.toLowerCase().replace(/[_-]?(?:eng|ge|en)$/, '');
    let candidates = translations.filter(x => stem(x._sys.filename) === stem(document._sys.filename));
    if (!candidates.length) candidates = translations.filter(x => x.image === document.image);
    // Reviewed pairs whose filenames/images/dates differ on the source site.
    const pairs = { Adjarian_Flavours_GE: 'Adjarian_Flavors_ENG', SummerGudauri2026_Ge: 'SummerGudauri26_ENG', FWT_OlympicSport: 'Freerire_Olympic_ENG', FAQ_ge: 'FAQ_eng', SummerEnd_2025: 'SummerEnds_2025eng', VisaDiscountGE: 'VisaDisountENG', Summer_Season: 'Summer_season_2024' };
    if (pairs[document._sys.filename]) candidates = translations.filter(x => x._sys.filename === pairs[document._sys.filename]);
    const translation = candidates.length === 1 ? candidates[0] : null;
    records.push({ module, sourceUrl: `https://mta.ski/ge/${module}/${document._sys.filename}`, document, translation });
  }
}
await writeFile(new URL('source.json', root), JSON.stringify({ collectedAt: new Date().toISOString(), records }, null, 2));
console.log(`Collected ${records.length} complete CMS documents; no database writes performed.`);
