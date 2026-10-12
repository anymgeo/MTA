import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
// Deliberately update only the requested About field via authenticated/audited CMS.
const origin = 'http://127.0.0.1:5100';
const copy = JSON.parse(await readFile(new URL('./resort-about-official.json', import.meta.url)));
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url)));
const cookies = new Map();
async function request(route, method = 'GET', body) {
  const headers = {};
  if (method !== 'GET') headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
  headers.Cookie = [...cookies].map(([key,value]) => `${key}=${value}`).join('; ');
  if (body) { headers['Content-Type']='application/json'; body=JSON.stringify(body); }
  const response = await fetch(origin+route,{method,headers,body});
  for (const cookie of response.headers.getSetCookie()) {
    const pair=cookie.split(';')[0],index=pair.indexOf('=');
    cookies.set(pair.slice(0,index),pair.slice(index+1));
  }
  assert(response.ok, `${method} ${route}: ${response.status}`);
  return response;
}
await request('/api/admin/login','POST',{email:credentials.AdminEmail,password:credentials.AdminPassword});
const resorts=await (await request('/api/admin/resorts')).json();
await mkdir(new URL('../.local/editorial-backups/',import.meta.url),{recursive:true});
for (const [slug,entry] of Object.entries(copy)) {
  const resort=resorts.find(r=>r.slug===slug); assert(resort,slug);
  const before=structuredClone(resort);
  for(const locale of ['ka','en']) { resort[locale].page ||= {}; resort[locale].page.about=entry[locale]; }
  await writeFile(new URL(`../.local/editorial-backups/${slug}-about-${Date.now()}.json`,import.meta.url),JSON.stringify(before));
  await request('/api/admin/resorts/'+resort.id,'PUT',resort);
  const saved=(await (await request('/api/admin/resorts')).json()).find(r=>r.id===resort.id);
  for(const locale of ['ka','en']) {
    assert.equal(saved[locale].page.about,entry[locale]);
    const unchanged=structuredClone(saved[locale]); unchanged.page.about=before[locale].page.about;
    assert.deepEqual(unchanged,before[locale],'Other resort content preserved');
  }
  console.log('PASS',slug,'official-source About saved in both languages; other fields preserved');
}
