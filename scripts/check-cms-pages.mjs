import assert from 'node:assert/strict';
const origin=process.env.TEST_SITE_ORIGIN || 'http://127.0.0.1:3100';
const api=process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const routes=new Set(['','about','contact','events','events/competitions','faq','news','projects','resorts','safety','structure','webcams']);
for(const [module,base] of [['leadership','about/leadership'],['history','about/history'],['infrastructure','about/infrastructure'],['documents','about/documents'],['safety','safety'],['events','events'],['projects','projects'],['webcams','webcams']]) {
 const response=await fetch(`${api}/api/content/${module}?locale=en`);assert.equal(response.status,200);
 if(base.startsWith('about/'))routes.add(base);
 if(!['documents','history'].includes(module))for(const row of await response.json()) routes.add(base+'/'+row.slug);
}
for(const resort of ['bakuriani','gudauri-kobi','mestia','goderdzi'])for(const suffix of ['','/maps','/activities'])routes.add('resorts/'+resort+suffix);
let count=0;
for(const locale of ['ka','en'])for(const route of routes){
 const response=await fetch(`${origin}/${locale}/${route}`,{signal:AbortSignal.timeout(60000)});
 const html=await response.text();assert.equal(response.status,200,`${locale}/${route}`);
 assert.ok(!html.includes('Internal Server Error')&&!html.includes('Invalid content record'),`${locale}/${route}: no server error`);
 assert.ok(html.includes('<footer'),`${locale}/${route}: global footer`);count++;
 console.log('PASS',locale+'/'+route);
}
console.log(`PASS ${count} public routes across Georgian and English`);
