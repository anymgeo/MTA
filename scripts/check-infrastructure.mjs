import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url), origin=process.env.TEST_SITE_ORIGIN||'http://127.0.0.1:3103';
const data=JSON.parse(await readFile(new URL('.local/infrastructure-extracted.json',root),'utf8'));
const snapshot=JSON.parse(await readFile(new URL('mtaprime/src/data/published-snapshot.json',root),'utf8'));
let totalLifts=0,totalTrails=0;
for(const [slug,entry] of Object.entries(data.resorts)){
  for(const locale of ['ka','en']){
    const resort=snapshot.responses['resorts?locale='+locale].find(r=>r.slug===slug);
    for(const [key,rows] of [['liftList',entry[locale].lifts],['trailList',entry[locale].trails]]){
      const publicRows=resort.page[key];
      assert.equal(publicRows.length,rows.length,`${slug}/${locale}: every supplied row exported`);
      rows.forEach(({source,sourceRaw,...expected},index)=>{
        assert.deepEqual(Object.fromEntries(Object.keys(expected).map(field=>[field,publicRows[index][field]])),expected,`${slug}/${locale}: supplied fields preserved for row ${index+1}`);
        assert(!('source' in publicRows[index])&&!('sourceRaw' in publicRows[index]),`${slug}/${locale}: private audit fields stripped`);
      });
    }
    const r=await fetch(`${origin}/${locale}/resorts/${slug}`); assert.equal(r.status,200);
    const html=await r.text();
    assert(html.includes('rp-infrastructure-tables'));
    const section=html.slice(html.indexOf('id="lifts-trails"'),html.indexOf('id="activities"'));
    assert.equal((section.match(/rp-infra-accordion/g)||[]).length,entry[locale].lifts.length);
    assert(section.includes('rp-infra-tabs')&&section.includes('rp-infra-search'));
    assert(!html.includes('Column3')); assert(!html.includes('sourceRaw'));
    assert(!html.includes('32750 m')&&!html.includes('32750 მ'),'Unconfirmed outlier not presented as factual length');
    console.log('PASS',slug,locale,entry[locale].lifts.length,'lifts',entry[locale].trails.length,'trails; complete source fields');
  }
  totalLifts+=entry.ka.lifts.length;totalTrails+=entry.ka.trails.length;
}
assert.equal(totalLifts,45);assert.equal(totalTrails,80);
const gudauri=data.resorts['gudauri-kobi'].ka.trails;
assert.equal(gudauri.filter(t=>t.name==='სპორტული 2').length,1);
assert.equal(gudauri.find(t=>t.name==='სპორტული 2').length,'2749 მ');
assert.equal(gudauri.find(t=>t.name==='გუდაურა 2').length,'');
assert.equal(gudauri.find(t=>t.name==='კიკილო 1').difficulty,'mixed');
assert.equal(data.resorts.mestia.ka.trails.filter(t=>t.difficulty==='expert').length,2);
assert.equal(data.resorts.goderdzi.ka.lifts[0].weekendHours,'10:00–17:00');
console.log('PASS 45 lifts / 80 unique trails, duplicate reconciliation, mixed/expert categories, uncertainty and weekend hours');
