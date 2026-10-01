import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
const origin=process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const creds=JSON.parse(await readFile(new URL('../.local/credentials.json',import.meta.url),'utf8'));
const modules=['leadership','events','contact','about','history','infrastructure','documents','safety','contacts','webcams','projects','structure','navigation','home-navigation','footer','page-text'];
function client(){const jar=new Map();return async function call(path,{method='GET',body}={}){
 const headers={};if(method!=='GET') {const s=await call('/api/admin/session');headers['X-CSRF-TOKEN']=(await s.json()).csrfToken;}
 headers.Cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');
 if(body && !(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const r=await fetch(origin+path,{method,headers,body});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0];const i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return r;
};}
const admin=client(),mod=client(),stamp=Date.now(); const temporary=[];let user;
async function json(r,status){const result=await r.json();assert.equal(r.status,status,JSON.stringify(result));return result;}
const input=r=>({slug:r.slug,ka:JSON.parse(r.kaJson),en:JSON.parse(r.enJson),sortOrder:r.sortOrder,published:r.published,version:r.version});
const digest=b=>createHash('sha256').update(b).digest('hex');
try {
 await json(await admin('/api/admin/login',{method:'POST',body:{email:creds.AdminEmail,password:creds.AdminPassword}}),200);
 const password='Qa!'+randomBytes(12).toString('hex')+'Z9';
 user=await json(await admin('/api/admin/users',{method:'POST',body:{email:`cms-${stamp}@example.test`,displayName:'CMS verification',role:'WebPortalModerator',password}}),201);
 await json(await mod('/api/admin/login',{method:'POST',body:{email:user.email,password}}),200);
 const jpeg=await readFile(new URL('../mtaprime/public/Gudauri.jpg',import.meta.url));
 for(const module of modules){
  const rows=await json(await admin('/api/admin/content/'+module),200);assert.ok(rows.length,module+' imported seed');
  // Every imported record must be saveable through the same validation used by the UI.
  for(const row of rows) await json(await admin(`/api/admin/content/${module}/${row.id}`,{method:'PUT',body:input(row)}),200);
  const original=rows[0];const body=input(original);body.slug='cms-test-'+stamp;body.ka.title='სატესტო ჩანაწერი';body.en.title='CMS test';body.published=false;body.version=null;
  const form=new FormData();form.append('file',new Blob([jpeg],{type:'image/jpeg'}),'test.jpg');
  const upload=await json(await mod('/api/admin/media',{method:'POST',body:form}),200);
  const media=await fetch(origin+upload.url);assert.equal(media.status,200);assert.equal(digest(Buffer.from(await media.arrayBuffer())),digest(jpeg));
  body.ka.image=body.en.image=upload.url;
  let row=await json(await mod('/api/admin/content/'+module,{method:'POST',body}),201);temporary.push({module,id:row.id});
  let pub=await json(await admin('/api/content/'+module+'?locale=en'),200);assert.ok(!pub.some(x=>x.slug===body.slug));
  const edit=input(row);edit.published=true;edit.sortOrder=-100;edit.en.description='Edited English';edit.ka.description='განახლებული ქართული';
  row=await json(await mod(`/api/admin/content/${module}/${row.id}`,{method:'PUT',body:edit}),200);
  assert.equal((await mod(`/api/admin/content/${module}/${row.id}`,{method:'PUT',body:edit})).status,409);
  for(const locale of ['ka','en']) {pub=await json(await admin('/api/content/'+module+'?locale='+locale),200);assert.equal(pub[0].id,row.id);assert.equal(pub[0].image,upload.url);assert.equal(pub[0].description,locale==='en'?'Edited English':'განახლებული ქართული');}
  const persisted=(await json(await admin('/api/admin/content/'+module),200)).find(x=>x.id===row.id);assert.equal(JSON.parse(persisted.enJson).image,upload.url);
  const audit=await json(await mod(`/api/admin/content/${module}/${row.id}/history`),200);assert.equal(audit.length,2);assert.ok(audit.every(x=>x.actor===user.email));
  assert.equal((await mod(`/api/admin/content/${module}/${row.id}?version=${row.version}`,{method:'DELETE'})).status,403);
  const ordered=await json(await admin('/api/admin/content/'+module),200);
  const requested=[...ordered.filter(x=>x.id!==row.id),ordered.find(x=>x.id===row.id)].map(x=>({id:x.id,version:x.version}));
  const reordered=await json(await mod('/api/admin/content/'+module+'/reorder',{method:'PUT',body:requested}),200);
  row=reordered.find(x=>x.id===row.id);
  assert.equal(reordered.at(-1).id,row.id,'Atomic reorder moves test record');
  assert.equal((await mod('/api/admin/content/'+module+'/reorder',{method:'PUT',body:requested})).status,409,'Stale reorder rejected');
  for(const saved of rows){const current=reordered.find(x=>x.id===saved.id);const restore=input(current);restore.sortOrder=saved.sortOrder;await json(await admin(`/api/admin/content/${module}/${saved.id}`,{method:'PUT',body:restore}),200);}
  const invalid=input(row);invalid.en.openTime='9am-ish';assert.equal((await admin(`/api/admin/content/${module}/${row.id}`,{method:'PUT',body:invalid})).status,400);
  assert.equal((await admin(`/api/admin/content/${module}/${row.id}?version=${row.version}`,{method:'DELETE'})).status,204);
  console.log('PASS',module,': seed editable, upload persisted, bilingual publish/edit/order, audit, conflict, moderator no-delete');
 }
 // Exercise PDF storage as well as image storage.
 const pdf=Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF');const f=new FormData();f.append('file',new Blob([pdf],{type:'application/pdf'}),'qa.pdf');const p=await json(await mod('/api/admin/resort-pdf',{method:'POST',body:f}),200);assert.equal(digest(Buffer.from(await(await fetch(origin+p.url)).arrayBuffer())),digest(pdf));
 const invalid=await fetch('http://127.0.0.1:3100/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:'QA',email:'invalid',subject:'general',message:'Test message body'})});assert.equal(invalid.status,400);
 const response=await fetch('http://127.0.0.1:3100/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:'CMS QA',lastName:'Test',email:`qa-${stamp}@example.test`,phone:'+995000000000',subject:'general',message:'Contact form end-to-end verification '+stamp,website:''})});assert.equal(response.status,201);
 const inbox=await json(await mod('/api/admin/messages'),200);const message=inbox.find(m=>m.email===`qa-${stamp}@example.test`);assert.ok(message);assert.equal(message.read,false);
 await json(await mod('/api/admin/messages/'+message.id,{method:'PUT',body:{read:true}}),200);
 assert.equal((await mod('/api/admin/messages/'+message.id,{method:'DELETE'})).status,403);
 assert.equal((await admin('/api/admin/messages/'+message.id,{method:'DELETE'})).status,204);
 console.log('PASS: PDF upload, contact form → database → moderator inbox/read → admin-only deletion');
} finally {
 for(const x of temporary){const rows=await(await admin('/api/admin/content/'+x.module)).json();const row=rows.find(r=>r.id===x.id);if(row)await admin(`/api/admin/content/${x.module}/${x.id}?version=${row.version}`,{method:'DELETE'});}
 if(user){const rows=await(await admin('/api/admin/users')).json();const u=rows.find(x=>x.id===user.id);if(u)await admin(`/api/admin/users/${u.id}?version=${u.version}`,{method:'DELETE'});}
}
