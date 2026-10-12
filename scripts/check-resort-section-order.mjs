import assert from 'node:assert/strict';

const origin = process.env.TEST_SITE_ORIGIN || 'http://localhost:3100';
for (const locale of ['ka', 'en']) {
  for (const slug of ['bakuriani', 'goderdzi', 'gudauri-kobi', 'mestia']) {
    const response = await fetch(`${origin}/${locale}/resorts/${slug}`);
    assert.equal(response.status, 200, `${locale}/${slug} loads`);
    const html = await response.text();
    const sections = ['about', 'lifts-trails', 'activities', 'terrain-map', 'events', 'gallery', 'meet'].map(id => html.indexOf(`id="${id}"`));
    assert(sections.every(index => index >= 0), 'Resort sections exist');
    assert(sections.every((position,index)=>index === 0 || position > sections[index-1]), 'Exact requested resort section order');
    assert(html.includes('class="unified-map') && !html.includes('class="cms-map"'), 'Original light map viewer restored');
    assert(html.includes('id="skipass"') && html.includes('id="downloads"'), 'Purchase and download sections retained');
    assert(html.includes('data-gallery-watermark="mta"'), 'Resort gallery has the display-only watermark');
    assert.equal((html.match(/id="meet"/g) || []).length, 1, 'Gallery occurs once');
    console.log(`PASS ${locale}/${slug}: exact section order; original map viewer, watermark, and purchase/download sections retained`);
  }
}
