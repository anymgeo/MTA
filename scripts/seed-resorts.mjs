import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const messages = { ka: read('../mtaprime/messages/ka.json'), en: read('../mtaprime/messages/en.json') };
function resolve(value, locale) {
  if (Array.isArray(value)) return value.map(v => resolve(v, locale));
  if (value && typeof value === 'object') {
    if (value.$message) return value.$message.split('.').reduce((a,k) => a[k], messages[locale]);
    return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, resolve(v, locale)]));
  }
  return value;
}
const seed = read('../mtaprime/src/data/fixtures/resorts.json').map(r => ({ id: randomUUID(), slug: r.slug, status: r.status, kaJson: JSON.stringify(resolve(r, 'ka')), enJson: JSON.stringify(resolve(r, 'en')), version: randomUUID() }));
writeFileSync(new URL('../mta.api/seed-resorts.json', import.meta.url), JSON.stringify(seed, null, 2));
console.log(`Prepared ${seed.length} bilingual resorts.`);
