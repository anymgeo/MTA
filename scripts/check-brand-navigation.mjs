import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const api = process.env.TEST_API_ORIGIN || 'http://localhost:5100';
const site = process.env.TEST_SITE_ORIGIN || 'http://localhost:3100';
const imported = JSON.parse(await readFile(new URL('../mta.api/official-news-2026.json', import.meta.url)));
const expected = ['resorts', 'maps', 'news', 'events', 'safety', 'about', 'faq'];
for (const locale of ['en', 'ka']) {
  const nav = await (await fetch(`${api}/api/content/navigation?locale=${locale}`)).json();
  assert.deepEqual(nav.filter(x => x.slug !== 'settings').map(x => x.slug), expected);
  assert.deepEqual(nav.find(x => x.slug === 'resorts').children.map(x => x.resortSlug), ['gudauri-kobi', 'mestia', 'bakuriani', 'goderdzi']);
  assert.deepEqual(nav.find(x => x.menuKind === 'today').children.map(x => x.href), ['/maps', '/#live', '/webcams']);
  assert.equal(nav.find(x => x.slug === 'safety').children.length, 0);
  const news = await (await fetch(`${api}/api/news?locale=${locale}`)).json();
  for (const article of imported) {
    const matches = news.filter(x => x.slug === article.slug);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].title, locale === 'ka' ? article.titleKa : article.titleEn);
    assert.equal((await fetch(site + matches[0].image)).status, 200);
  }
  for (const path of ['', '/maps', '/webcams', '/faq', '/news', '/events', '/safety', '/safety/piste-classification', '/about', '/projects', '/news/mestia-summer-season-2026', '/resorts/gudauri-kobi/maps', '/resorts/mestia/maps', '/resorts/bakuriani/maps', '/resorts/goderdzi/maps']) {
    const response = await fetch(`${site}/${locale}${path}`);
    assert.equal(response.status, 200, locale + path);
    if (!path) {
      const html = await response.text();
      assert.ok(!html.includes('id="map"'));
      assert.ok(html.includes('mta-official-light.svg'));
      assert.ok(!html.includes('href="/' + locale + '/safety/piste-classification"'));
    }
  }
  console.log(`${locale}: CMS menus, official news, covers and public routes passed.`);
}
assert.equal((await fetch(site + '/sitemap.xml')).status, 200);
assert.equal((await fetch(site + '/robots.txt')).status, 200);
console.log('SEO routes passed. Read-only verification complete.');
