import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const root=new URL('../',import.meta.url), origin='http://127.0.0.1:5100';
const data=JSON.parse(await readFile(new URL('.local/infrastructure-extracted.json',root),'utf8'));
const credentials=JSON.parse(await readFile(new URL('.local/credentials.json',root),'utf8'));
const cookies=new Map();
async function request(path,method='GET',body) {
  const headers={};
  if(method!=='GET') headers['X-CSRF-TOKEN']=(await request('/api/admin/session')).csrfToken;
  headers.Cookie=[...cookies].map(([k,v])=>`${k}=${v}`).join('; ');
  if(body) headers['Content-Type']='application/json';
  const r=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined});
  for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
  assert(r.ok,`${method} ${path}: ${r.status} ${r.ok?'':await r.text()}`);
  return r.json();
}
await request('/api/admin/login','POST',{email:credentials.AdminEmail,password:credentials.AdminPassword});
const resorts=await request('/api/admin/resorts');
const apply=process.argv.includes('--apply');
const backup=new URL('.local/infrastructure-backups/',root);
await mkdir(backup,{recursive:true});
if(apply) await writeFile(new URL(`resorts-${Date.now()}.json`,backup),JSON.stringify(resorts,null,2));
const expected={bakuriani:[12,26],goderdzi:[3,4],'gudauri-kobi':[21,36],mestia:[9,14]};
const destinationFields=['destinationLabel','destinationLat','destinationLng','destinationUrl'];
function preserveTrailDestinations(incoming,existing=[]) {
  const identity=row=>row.sourceRaw||`${row.area||''}:\0:${row.name||''}`;
  const previous=new Map(existing.map(row=>[identity(row),row]));
  return incoming.map(row=>{
    const match=previous.get(identity(row));
    if(!match)return row;
    const destination=Object.fromEntries(destinationFields.filter(key=>match[key]).map(key=>[key,match[key]]));
    return {...row,...destination};
  });
}
for(const [slug,entry] of Object.entries(data.resorts)) {
  const before=resorts.find(r=>r.slug===slug); assert(before,slug);
  const next=structuredClone(before);
  const beforeMap=await request(`/api/admin/resorts/${before.id}/map`);
  const mapHash=createHash('sha256').update(JSON.stringify(beforeMap)).digest('hex');
  for(const locale of ['ka','en']) {
    const {lifts}=entry[locale];
    const trails=preserveTrailDestinations(entry[locale].trails,next[locale].page?.trailList);
    assert.deepEqual([lifts.length,trails.length],expected[slug]);
    assert(new Set(trails.map(t=>t.area+':'+t.name)).size===trails.length);
    for(const row of [...lifts,...trails]) for(const [key,value] of Object.entries(row)) assert(typeof value==='string'&&value.length<=4000,`${slug} ${key}`);
    next[locale].page ||= {};
    next[locale].page.liftList=lifts; next[locale].page.trailList=trails;
    next[locale].page.infrastructureImportNotes=entry.notes.join('\n');
    next[locale].liftList=lifts.map(({name,type,hours})=>({name,type,hours}));
    next[locale].lifts=String(lifts.length); next[locale].trails=String(trails.length);
    const uncertain=trails.some(t=>!t.length);
    const total=trails.reduce((sum,t)=>sum+Number(t.length.match(/^\d+(?:\.\d+)?/)?.[0]||0),0);
    next[locale].pistes=uncertain?(locale==='ka'?'დასაზუსტებელია':'To be confirmed'):`≈ ${(total/1000).toFixed(3)} ${locale==='ka'?'კმ':'km'}`;
  }
  if(isDeepStrictEqual(before.ka,next.ka)&&isDeepStrictEqual(before.en,next.en)){console.log('UNCHANGED',slug);continue;}
  if(!apply){console.log('PLAN',slug,...expected[slug]);continue;}
  const saved=await request('/api/admin/resorts/'+next.id,'PUT',next);
  for(const locale of ['ka','en']) assert.deepEqual(saved[locale],next[locale],'CMS saved all source metadata');
  const afterMap=await request(`/api/admin/resorts/${before.id}/map`);
  assert.equal(createHash('sha256').update(JSON.stringify(afterMap)).digest('hex'),mapHash,'Map geometry/status must not change');
  const publicResorts=await request(`/api/resorts?locale=ka`), pub=publicResorts.find(r=>r.slug===slug);
  assert.equal(pub.page.liftList.length,expected[slug][0]); assert.equal(pub.page.trailList.length,expected[slug][1]);
  assert(!('infrastructureImportNotes' in pub.page)); assert(!('sourceRaw' in pub.page.liftList[0]));
  console.log('PASS',slug,'CMS persisted, public API updated, map unchanged');
}
