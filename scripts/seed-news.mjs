import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const fixtures = read('../mtaprime/src/data/fixtures/news.json');
const messages = { ka: read('../mtaprime/messages/ka.json'), en: read('../mtaprime/messages/en.json') };
const images = readdirSync(new URL('../mtaprime/public/news/', import.meta.url));
function asset(path) {
  const original = path.split('/').pop();
  const found = images.find(x => x.toLowerCase() === original.toLowerCase());
  return '/news/' + (found || 'Goderdzi1.jpg');
}
function resolve(value, locale) {
  if (Array.isArray(value)) return value.map(x => resolve(x, locale));
  if (value?.$message) return value.$message.split('.').reduce((a, key) => a[key], messages[locale]);
  return value;
}
const seed = fixtures.map(n => ({
  id: randomUUID(), slug: n.slug, date: n.date, image: asset(n.image), gallery: [...new Set(n.gallery.map(asset))],
  titleKa: resolve(n.title, 'ka'), excerptKa: resolve(n.excerpt, 'ka'), contentKa: resolve(n.content, 'ka'),
  titleEn: resolve(n.title, 'en'), excerptEn: resolve(n.excerpt, 'en'), contentEn: resolve(n.content, 'en'),
  published: true, updatedAt: new Date().toISOString(), version: randomUUID()
}));
writeFileSync(new URL('../mta.api/seed-news.json', import.meta.url), JSON.stringify(seed, null, 2));
console.log(`Prepared ${seed.length} existing articles in both languages.`);
