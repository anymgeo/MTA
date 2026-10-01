import assert from 'node:assert/strict';
import {canonicalTestTimes} from './canonical-test-times.mjs';
import { readFile, unlink } from 'node:fs/promises';
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));
const cookies = new Map();
async function request(path, {method='GET',body,csrf=true}={}) {
  const headers = {};
  if (method !== 'GET' && csrf) headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
  headers.Cookie = [...cookies].map(([k,v]) => k+'='+v).join('; ');
  if (body && !(body instanceof FormData)) { headers['Content-Type']='application/json';body=JSON.stringify(body); }
  const response = await fetch(origin+path,{method,body,headers,redirect:'manual'});
  for (const value of response.headers.getSetCookie()) {const pair=value.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
  return response;
}
let record, media, videoMedia;
try {
  assert.equal((await request('/api/admin/login',{method:'POST',body:{email:credentials.AdminEmail,password:credentials.AdminPassword}})).status,200);
  const rows=await (await request('/api/admin/resorts')).json();
  for(const slug of ['bakuriani','gudauri-kobi','mestia','goderdzi']) {
    const item=rows.find(r=>r.slug===slug);
    assert.ok(item?.ka.page.social.resortFacebook);
    assert.ok(item?.en.page.social.instagram);
    for (const lang of ['en','ka']) {
      assert.match(item[lang].page.videoUrl,/\.mp4$/);
      assert.match(item[lang].page.posterUrl,/\.jpg$/);
    }
  }
  const source=rows.find(r=>r.slug==='bakuriani');
  const input=canonicalTestTimes(structuredClone(source)); input.id=undefined;input.version=null;input.slug='verify-template-'+Date.now();
  for(const lang of ['ka','en']) {
    input[lang].page.about='Verification copy '+lang;
    input[lang].page.liftList=[{name:'Test lift',type:'Gondola',duration:'5 min',hours:'09:00–17:00'}];
    input[lang].page.trailList=[{name:'Test trail',length:'1 km',difficulty:'easy'}];
    input[lang].page.activities=[{title:'Test activity',text:'Test description',iconKey:'hiking'}];
  }
  let response=await request('/api/admin/resorts',{method:'POST',body:input});
  assert.equal(response.status,201);record=await response.json();
  for(const locale of ['en','ka']) {
    const publicRows=await (await fetch(origin+'/api/resorts?locale='+locale)).json();
    assert.equal(publicRows.find(r=>r.id===record.id).page.about,'Verification copy '+locale);
  }
  for(const bad of [{videoUrl:'javascript:alert(1)'},{videoUrl:'https://example.com/a.gif'},{pdfUrl:'https://example.com/a.html'},
      {videoWebmUrl:'https://example.com/not-webm.mp4'},{posterUrl:'javascript:alert(1)'},
      {trailList:[{name:'bad',length:'1 km',difficulty:'unknown'}]},{markerX:'200'},{social:{facebook:'javascript:alert(1)'}}]) {
    response=await request('/api/admin/resorts/'+record.id,{method:'PUT',body:{...record,en:{...record.en,page:{...record.en.page,...bad}}}});
    assert.equal(response.status,400);
  }
  const form=new FormData();form.set('file',new Blob(['not a PDF'],{type:'application/pdf'}),'fake.pdf');
  assert.equal((await request('/api/admin/resort-pdf',{method:'POST',body:form})).status,400);
  form.set('file',new Blob(['%PDF-1.4\n% temporary upload verification\n%%EOF'],{type:'application/pdf'}),'test.pdf');
  assert.equal((await request('/api/admin/resort-pdf',{method:'POST',body:form,csrf:false})).status,400);
  response=await request('/api/admin/resort-pdf',{method:'POST',body:form});
  assert.equal(response.status,200);media=(await response.json()).url;
  assert.match(media,/^\/media\/[a-f0-9]{32}\.pdf$/);
  response=await request('/api/admin/resorts/'+record.id,{method:'PUT',body:{...record,en:{...record.en,page:{...record.en.page,pdfUrl:media}}}});
  assert.equal(response.status,200);record=await response.json();
  const file=await fetch(origin+media);assert.equal(file.status,200);assert.match(file.headers.get('content-type'),/application\/pdf/);
  assert.match(file.headers.get('content-disposition'),/attachment/);
  form.set('file',new Blob(['not a real video file'],{type:'video/mp4'}),'fake.mp4');
  assert.equal((await request('/api/admin/resort-video',{method:'POST',body:form})).status,400);
  const videoBytes=await readFile(new URL('../mtaprime/public/videos/bakuriani.mp4',import.meta.url));
  form.set('file',new Blob([videoBytes],{type:'video/mp4'}),'bakuriani.mp4');
  assert.equal((await request('/api/admin/resort-video',{method:'POST',body:form,csrf:false})).status,400);
  response=await request('/api/admin/resort-video',{method:'POST',body:form});
  assert.equal(response.status,200);videoMedia=(await response.json()).url;
  assert.match(videoMedia,/^\/media\/[a-f0-9]{32}\.mp4$/);
  const videoResponse=await fetch(origin+videoMedia,{headers:{Range:'bytes=0-31'}});
  assert.equal(videoResponse.status,206); assert.match(videoResponse.headers.get('content-type'),/video\/mp4/);
  assert.equal((await videoResponse.arrayBuffer()).byteLength,32);
  response=await request('/api/admin/resorts/'+record.id,{method:'PUT',body:{...record,en:{...record.en,page:{...record.en.page,videoUrl:videoMedia,videoWebmUrl:'/videos/bakuriani.webm'}}}});
  assert.equal(response.status,200);record=await response.json();assert.equal(record.en.page.videoUrl,videoMedia);
  const previousPage=record.en.page, legacy={...record,en:{...record.en}}; delete legacy.en.page;
  response=await request('/api/admin/resorts/'+record.id,{method:'PUT',body:legacy});assert.equal(response.status,200);record=await response.json();
  assert.deepEqual(record.en.page,previousPage);
  console.log('PASS: bilingual resort content, media migration, URL validation, PDF/video upload + CSRF, video byte ranges, optional WebM, and legacy-client content preservation.');
} finally {
  if(record) {
    const rows=await (await request('/api/admin/resorts')).json(), current=rows.find(r=>r.id===record.id);
    if(current) assert.equal((await request('/api/admin/resorts/'+current.id+'?version='+current.version,{method:'DELETE'})).status,204);
  }
  if(media && /^\/media\/[a-f0-9]{32}\.pdf$/.test(media))
    await unlink(new URL('../.local/storage'+media,import.meta.url));
  if(videoMedia && /^\/media\/[a-f0-9]{32}\.mp4$/.test(videoMedia))
    await unlink(new URL('../.local/storage'+videoMedia,import.meta.url));
}
