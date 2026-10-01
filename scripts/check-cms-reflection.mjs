import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const creds=JSON.parse(await readFile(new URL('../.local/credentials.json',import.meta.url),'utf8'));
const api=process.env.TEST_API_ORIGIN||'http://127.0.0.1:5100',site=process.env.TEST_SITE_ORIGIN||'http://127.0.0.1:3100';
const jar=new Map();
async function call(path,{method='GET',body}={}){
 const headers={};if(method!=='GET')headers['X-CSRF-TOKEN']=(await call('/api/admin/session')).csrfToken;
 headers.Cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');if(body){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const r=await fetch(api+path,{method,headers,body});for(const c of r.headers.getSetCookie()){const s=c.split(';')[0],i=s.indexOf('=');jar.set(s.slice(0,i),s.slice(i+1));}assert.ok(r.ok,`${path}: ${r.status}`);return r.json();
}
await call('/api/admin/login',{method:'POST',body:{email:creds.AdminEmail,password:creds.AdminPassword}});
const checks=[['leadership','about/leadership','title'],['events','events','title'],['contact','contact','phone'],['about','about','mainText'],['history','about/history','blocks.0.text'],['infrastructure','about/infrastructure','title'],['documents','about/documents','title'],['safety',null,'title'],['contacts','safety/emergency-contacts','title'],['webcams','webcams','title'],['projects','projects','title'],['structure','structure','structureData.director.title'],['navigation','contact','title'],['footer','contact','texts.Footer.georgiaMountainTrailsYourStartingPoint_43bd70'],['page-text','about/leadership','texts.Portal.titles.leadership']];
for(const [module,page,field] of checks){
 const rows=await call('/api/admin/content/'+module);const row=['contact','about','structure','footer','page-text'].includes(module)?rows.find(x=>x.slug==='settings'):rows.find(x=>x.published&&x.slug!=='settings');assert.ok(row,module);
 const original={ka:JSON.parse(row.kaJson),en:JSON.parse(row.enJson)};
 const body={slug:row.slug,sortOrder:row.sortOrder,published:row.published,version:row.version,ka:structuredClone(original.ka),en:structuredClone(original.en)};
 const marker='CMS-REFLECTION-'+Date.now();
 for(const locale of ['ka','en']){let target=body[locale];const keys=field.split('.');for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=marker+'-'+locale;}
 try{
  await call(`/api/admin/content/${module}/${row.id}`,{method:'PUT',body});
  for(const locale of ['ka','en']){const route=page||'safety/'+row.slug;const r=await fetch(`${site}/${locale}/${route}`);const html=await r.text();assert.equal(r.status,200,route);assert.ok(html.includes(marker+'-'+locale),`${module} ${locale}: saved content appears in rendered HTML`);}
  console.log('PASS CMS → public Georgian/English:',module);
 }finally{const latest=(await call('/api/admin/content/'+module)).find(x=>x.id===row.id);await call(`/api/admin/content/${module}/${row.id}`,{method:'PUT',body:{...body,...original,version:latest.version}});}
}
