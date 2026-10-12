import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:5100';
const targetSlug=process.env.TEST_RESORT_SLUG||'bakuriani';
const credentials = JSON.parse(await readFile(new URL('../.local/credentials.json', import.meta.url), 'utf8'));

function client() {
  const cookies = new Map();
  async function request(path, { method = 'GET', body, csrf = true,headers:extraHeaders={} } = {}) {
    const headers = {...extraHeaders};
    if (method !== 'GET' && csrf) headers['X-CSRF-TOKEN'] = (await (await request('/api/admin/session')).json()).csrfToken;
    headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    if(body instanceof Blob)headers['Content-Type']=body.type;
    else if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(origin + path, { method, body, headers, redirect: 'manual' });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0]; const split = pair.indexOf('='); cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return response;
  }
  return request;
}

async function login(request, email, password) {
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { email, password } })).status, 200);
}

const admin = client();
const moderator = client();
const password = `Verify!${randomBytes(12).toString('hex')}A1`;
const email = `map-editor-${Date.now()}@example.test`;
let user;
let feature;
let originalMap;
let didUpload=false;

try {
  await login(admin, credentials.AdminEmail, credentials.AdminPassword);
  let response = await admin('/api/admin/users', { method: 'POST', body: { email, displayName: 'Map verification moderator', role: 'WebPortalModerator', password } });
  assert.equal(response.status, 201); user = await response.json();
  await login(moderator, email, password);

  const resorts = await (await admin('/api/admin/resorts')).json();
  const resort = resorts.find(item => item.slug === targetSlug);
  assert.ok(resort, 'QA resort exists');
  let map = await (await moderator(`/api/admin/resorts/${resort.id}/map`)).json();
  originalMap = map;
  const referenceWidth = map.width;
  const referenceHeight = map.height;
  const originalPoints = JSON.stringify(map.features.map(item => item.points));
  if(process.env.TEST_SKIP_MAP_IMAGE_UPLOAD!=='1'){
  const imageBytes = Buffer.from(await (await fetch(origin + map.imageUrl)).arrayBuffer());
  const imageForm = new FormData();
  const extension = map.imageUrl.split('.').at(-1);
  imageForm.set('file', new Blob([imageBytes], { type: extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg' }), 'map.'+extension);
  imageForm.set('version', map.version);
  response = await admin(`/api/admin/maps/${map.id}/image-upload`, { method: 'POST', body: new Blob([imageBytes],{type:extension==='png'?'image/png':extension==='webp'?'image/webp':'image/jpeg'}),headers:{'X-Map-Version':map.version} });
  assert.equal(response.status, 200, 'Map image upload prepares a non-destructive preview');
  const pending=(await response.json()).pendingImage;
  assert.equal((await (await admin(`/api/admin/resorts/${resort.id}/map`)).json()).imageUrl,map.imageUrl,'Preparation does not mutate the live map');
  response=await admin(`/api/admin/maps/${map.id}/image-replacement`,{method:'POST',body:{version:map.version,token:pending.token,alignment:{scaleX:1,scaleY:1,rotation:0,offsetX:0,offsetY:0},alignmentConfirmed:true}});
  assert.equal(response.status,200,'Confirmed image and geometry save together');map=await response.json();
  assert.match(map.imageUrl, /^\/media\/map-[a-f0-9]{32}\.(jpg|png|webp)$/, 'Saved map uses managed media URL');
  assert.equal(map.width, referenceWidth, 'Reference width remains unchanged');
  assert.equal(map.height, referenceHeight, 'Reference height remains unchanged');
  assert.equal(JSON.stringify(map.features.map(item => item.points)), originalPoints, 'Existing feature coordinates do not shift');
  const persistedMap = await (await admin(`/api/admin/resorts/${resort.id}/map`)).json();
  assert.equal(persistedMap.imageUrl, map.imageUrl, 'Uploaded map persists after reload');
  didUpload=true;
  }
  const staleVersion = map.version;
  const payload = {
    mapVersion: map.version, version: null, typeKey: 'trail', points: [[100, 100], [220, 180]],
    nameKa: 'ტესტ ტრასა', nameEn: 'Verification trail', descriptionKa: '', descriptionEn: '',
    status: 'open', difficulty: 'easy', liftType: '', opens: '', closes: '', durationMinutes: null,
  };
  response = await moderator(`/api/admin/maps/${map.id}/features`, { method: 'POST', body: payload });
  assert.equal(response.status, 200); map = await response.json(); feature = map.features.find(item => item.nameEn === payload.nameEn);
  assert.ok(feature?.createdByName && feature?.createdAt, 'Audit creator recorded');

  const publicMap = await (await admin('/api/maps/'+targetSlug+'?locale=en')).json();
  assert.ok(publicMap.managed && publicMap.features.some(item => item.id === feature.id), 'Save is immediately public');

  response = await moderator(`/api/admin/maps/${map.id}/features/${feature.id}`, { method: 'PUT', body: { ...payload, mapVersion: staleVersion, version: feature.version } });
  assert.equal(response.status, 409, 'Stale map save is rejected');
  response = await moderator(`/api/admin/maps/${map.id}/features/${feature.id}?mapVersion=${map.version}&version=${feature.version}`, { method: 'DELETE' });
  assert.equal(response.status, 403, 'Moderator cannot delete');

  const curvedPoints = [[100, 100, -80, 100, 120, 100], [160, 135, 140, 120, 180, 150], [220, 180]];
  response = await moderator(`/api/admin/maps/${map.id}/features/${feature.id}`, { method: 'PUT', body: { ...payload, mapVersion: map.version, version: feature.version, points: curvedPoints,anchorModes:['corner','smooth','corner'],label:{x:150,y:150,textKa:'ტრასა',textEn:'Trail'} } });
  assert.equal(response.status, 200); map = await response.json(); feature = map.features.find(item => item.id === feature.id);
  assert.equal(feature.points.length, 3, 'Vertices persist after edit');
  assert.deepEqual(feature.points, curvedPoints, 'Bezier control handles persist without a schema migration');
  assert.deepEqual(feature.anchorModes,['corner','smooth','corner']);assert.equal(feature.label.textKa,'ტრასა');
  const rendered=await (await admin('/api/maps/'+targetSlug+'?locale=en')).json();assert.equal(rendered.features.find(f=>f.id===feature.id).label.text,'Trail');
  const history = await (await moderator(`/api/admin/maps/${map.id}/history?featureId=${feature.id}`)).json();
  assert.deepEqual(history.map(item => item.action).slice(0, 2), ['edit', 'create']);

  response = await moderator(`/api/admin/maps/${map.id}/features`, { method: 'POST', body: { ...payload, mapVersion: map.version, points: [[1, 1]], nameEn: 'Invalid one-point trail' } });
  assert.equal(response.status, 400, 'A line requires two points');
  response = await moderator(`/api/admin/maps/${map.id}/features`, { method: 'POST', body: { ...payload, mapVersion: map.version, opens: '9am-ish', closes: '17:00' } });
  assert.equal(response.status, 400, 'Time dropdown values are enforced server-side');
  response=await moderator(`/api/admin/maps/${map.id}/features`,{method:'POST',body:{...payload,mapVersion:map.version,points:[[1,1],[map.width+1,10]]}});assert.equal(response.status,400,'Anchors remain inside the native map');
  response=await moderator(`/api/admin/maps/${map.id}/image-upload`,{method:'POST',body:new Blob(['not an image'],{type:'image/png'}),headers:{'X-Map-Version':map.version}});assert.equal(response.status,403,'Moderator cannot upload images');

  response = await admin(`/api/admin/maps/${map.id}/features/${feature.id}?mapVersion=${map.version}&version=${feature.version}`, { method: 'DELETE' });
  assert.equal(response.status, 200); map = await response.json();
  response = await admin(`/api/admin/maps/${map.id}/features/${feature.id}/restore?mapVersion=${map.version}`, { method: 'POST' });
  assert.equal(response.status, 200, 'Admin can undo a deletion'); map = await response.json();
  feature = map.features.find(item => item.id === feature.id);
  assert.ok(feature, 'Restored feature is visible again');
  response = await admin(`/api/admin/maps/${map.id}/features/${feature.id}?mapVersion=${map.version}&version=${feature.version}`, { method: 'DELETE' });
  assert.equal(response.status, 200); feature = null;
  console.log('PASS: '+(didUpload?'map-image upload; ':'')+'visual-map API, cubic handles outside the map, bilingual labels/modes, undo-delete restore, public rendering contract, audit history, concurrency conflict, anchor validation, metadata validation, and moderator delete/upload restrictions.');
} finally {
  if (didUpload&&originalMap?.imageUrl.startsWith('/media/map-')) {
    const current = await (await admin(`/api/admin/resorts/${originalMap.resortId}/map`)).json();
    const prepared=await admin(`/api/admin/maps/${current.id}/image`, {method:'PUT',body:{imageUrl:originalMap.imageUrl,width:originalMap.width,height:originalMap.height,version:current.version}});
    assert.equal(prepared.status,200);const pending=(await prepared.json()).pendingImage;
    const restored=await admin(`/api/admin/maps/${current.id}/image-replacement`,{method:'POST',body:{version:current.version,token:pending.token,alignment:{scaleX:1,scaleY:1,rotation:0,offsetX:0,offsetY:0},alignmentConfirmed:true}});assert.equal(restored.status,200);
  }
  if (feature) {
    const resorts = await (await admin('/api/admin/resorts')).json();
    const resort = resorts.find(item => item.slug === targetSlug);
    const map = await (await admin(`/api/admin/resorts/${resort.id}/map`)).json();
    const current = map.features.find(item => item.id === feature.id);
    if (current) await admin(`/api/admin/maps/${map.id}/features/${current.id}?mapVersion=${map.version}&version=${current.version}`, { method: 'DELETE' });
  }
  if (user) {
    const users = await (await admin('/api/admin/users')).json();
    const current = users.find(item => item.id === user.id);
    if (current) await admin(`/api/admin/users/${current.id}?version=${current.version}`, { method: 'DELETE' });
  }
}
