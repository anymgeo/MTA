import assert from 'node:assert/strict';
const origin = process.env.TEST_SITE_ORIGIN || 'http://127.0.0.1:3102';
for (const locale of ['ka', 'en']) {
  for (const slug of ['bakuriani', 'gudauri-kobi', 'mestia', 'goderdzi']) {
    const response = await fetch(`${origin}/${locale}/resorts/${slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    const about = html.slice(html.indexOf('id="about"'), html.indexOf('id="lifts-trails"'));
    assert(about.includes('rp-about-copy'), 'Text-only About block exists');
    assert(!/GeorgiaJourney|<svg|<details|rp-facts/.test(about), 'Extra map/cards removed');
    assert(!html.includes('class="language-flag'), 'Language flags removed');
    assert(html.includes('ENG') && html.includes('ქარ'), 'Text language options retained');
    if (slug === 'bakuriani') assert(about.includes(locale === 'ka' ? 'კოხტა და მიტარბი' : 'Didveli, Kokhta and Mitarbi'), 'Official-source copy rendered');
    console.log(`PASS ${locale}/${slug}: text-only About; flag-free language controls`);
  }
}
