// Local-only, authenticated, audited and repeatable. Existing user objects are retained.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import features, { transfer } from './gudauri-official-tracing.mjs';
const origin = 'http://127.0.0.1:5100';
const root = new URL('../', import.meta.url);
const credentials = JSON.parse(await readFile(new URL('.local/credentials.json', root), 'utf8'));
const cookies = new Map();
async function request(path, method = 'GET', body) {
  const headers = {};
  if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await request('/api/admin/session')).csrfToken;
  headers.Cookie = [...cookies].map(([k,v])=>`${k}=${v}`).join('; ');
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(origin+path,{method,headers,body:body ? JSON.stringify(body) : undefined,redirect:'manual'});
  for (const value of response.headers.getSetCookie()) {
    const pair=value.split(';')[0], index=pair.indexOf('='); cookies.set(pair.slice(0,index),pair.slice(index+1));
  }
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  return response.json();
}
await request('/api/admin/login','POST',{email:credentials.AdminEmail,password:credentials.AdminPassword});
const resorts=await request('/api/admin/resorts');
const resort=resorts.find(r=>r.slug==='gudauri-kobi');
assert.ok(resort);
let map=await request(`/api/admin/resorts/${resort.id}/map`);
assert.equal(map.imageUrl,'/maps/gudauri-clean.png');
assert.equal(map.width,1183); assert.equal(map.height,1330);
const types = [
  ['expert-trail','ექსპერტი','Expert piste','line','#171717','trail'],
  ['ski-way','დამაკავშირებელი გზა','Connecting ski way','line','#22385d','trail'],
  ['label','წარწერა','Reference label','point','#17231f','pin'],
  ['official-hazard','ოფიციალური რუკის საფრთხე','Reference hazard','point','#fcb714','warning'],
  ['rescue','სამაშველო','Rescue 112','point','#ee4223','pin'],
  ['panorama','პანორამული ხედი','Panoramic view','point','#17231f','pin'],
  ['ticket-office','სალარო','Ticket office','point','#17231f','pin'],
  ['parking','პარკინგი','Parking','point','#24c2e9','pin'],
  ['lodging','განთავსება','Lodging','point','#17231f','pin'],
  ['services','კვება და მომსახურება','Restaurant and services','point','#17231f','pin'],
  ['snowpark','სნოუპარკი','Snowpark','polygon','#fcb714','pin'],
  ['beginner-area','დამწყებთა ტერიტორია','Beginners area','polygon','#1db585','pin'],
];
const apply=process.argv.includes('--apply');
const backupDirectory=new URL('.local/map-trace-backups/',root);
if (apply) {
  await mkdir(backupDirectory,{recursive:true});
  await writeFile(new URL(`gudauri-${Date.now()}.json`,backupDirectory),JSON.stringify(map,null,2));
  for (const [key,nameKa,nameEn,geometryKind,color,icon] of types) {
    if (!map.types.some(t=>t.key===key)) await request('/api/admin/map-types','POST',{key,nameKa,nameEn,geometryKind,color,icon,statuses:['unknown'],active:true});
  }
  map=await request(`/api/admin/resorts/${resort.id}/map`);
}
let created=0,updated=0,unchanged=0;
let archivedTest=0;
if (apply && process.argv.includes('--archive-existing-test')) {
  // Human explicitly approved archiving this one pre-existing test line.
  const test=map.features.find(f=>f.id==='7b672998-e27b-46ad-8b2c-bd835e21938b');
  if (test) {
    assert.equal(test.nameKa,'kom'); assert.equal(test.nameEn,'lom');
    map=await request(`/api/admin/maps/${map.id}/features/${test.id}?mapVersion=${map.version}&version=${test.version}`,'DELETE');
    archivedTest=1;
  }
}
for (const f of features) {
  const typeKey=f.kind==='warning' ? 'official-hazard' : f.kind;
  const traceKey=`official-trace:gudauri-v1:${f.kind}:${f.name}`;
  const points=f.points.map(transfer);
  assert.ok(points.every(([x,y])=>x>=0 && x<=1183 && y>=0 && y<=1330),f.name);
  const before=map.features.find(item=>item.descriptionEn?.includes(traceKey));
  const descriptionEn=`${traceKey}\nTraced from supplied GudauriWinter.jpg main perspective. Historical reference, not live operating information. Kobi inset uses a different perspective and is excluded.`;
  const descriptionKa=`${traceKey}\nგადატანილია მოწოდებული GudauriWinter.jpg-ის ძირითადი რუკიდან. ისტორიული რუკაა და არა მიმდინარე სამუშაო ინფორმაცია. კობის სხვა პერსპექტივის ჩანართი არ არის გადატანილი.`;
  const nameKa=f.kind==='warning' ? `საფრთხის ტერიტორია ${f.name.split(' ').at(-1)}` : f.name;
  const body={mapVersion:map.version,version:before?.version ?? null,typeKey,points,nameKa,nameEn:f.name,descriptionKa,descriptionEn,status:'unknown',difficulty:f.difficulty,liftType:f.liftType,opens:'',closes:'',durationMinutes:null};
  if (before && JSON.stringify(before.points)===JSON.stringify(points) && before.typeKey===typeKey) { unchanged++; continue; }
  if (apply) map=await request(`/api/admin/maps/${map.id}/features${before ? '/'+before.id : ''}`,before?'PUT':'POST',body);
  if (before) updated++; else created++;
}
console.log(JSON.stringify({mode:apply?'applied':'dry-run',created,updated,unchanged,archivedTest,existingUserFeaturesRetained:map.features.filter(f=>!f.descriptionEn?.includes('official-trace:gudauri-v1:')).length,referenceFeatures:features.length}));
