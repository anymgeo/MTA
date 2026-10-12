// Refresh the temporary public release from published, anonymous API responses only.
// Never export admin endpoints, credentials, users, messages, revisions or draft records.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {stat,unlink} from 'node:fs/promises';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = new URL(process.env.SNAPSHOT_API_ORIGIN || 'http://127.0.0.1:5100');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) throw new Error('Export only from the local CMS.');
const modules = ['leadership','events','contact','about','history','infrastructure','documents','safety','contacts','webcams','projects','structure','navigation','home-navigation','footer','page-text'];
const responses = {}, media = new Set(), assets = [], tilePyramids=new Map();
const mediaPattern = /\/media\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp|svg|pdf|mp4|webm)/gi;
function collect(value) {
  if (typeof value === 'string') for (const match of value.matchAll(mediaPattern)) media.add(match[0]);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') {
    if(value.tiles?.baseUrl?.startsWith('/media/')&&value.tiles.tileSize>0&&value.tiles.maxLevel>=0)tilePyramids.set(value.tiles.baseUrl,value.tiles);
    for (const [key, item] of Object.entries(value)) {
      if (/password|csrf|token|emailConfirmed|securityStamp|connectionString|createdBy|updatedBy/i.test(key)) throw new Error('Private field found: ' + key);
      collect(item);
    }
  }
}
function key(resource, locale) {
  const url = new URL(resource, 'https://snapshot.invalid/');
  if (locale) url.searchParams.set('locale', locale);
  url.searchParams.sort();
  return url.pathname.slice(1) + (url.search ? url.search : '');
}
async function get(resource, locale) {
  const resourceKey = key(resource, locale);
  const response = await fetch(new URL('/api/' + resourceKey, origin), {signal: AbortSignal.timeout(15000), redirect:'error'});
  if (!response.ok && response.status !== 404) throw new Error(resourceKey + ': ' + response.status);
  const value = response.status === 404 ? null : await response.json();
  collect(value); responses[resourceKey] = value; return value;
}
const portal = JSON.parse(await readFile(path.join(root,'mtaprime/src/data/fixtures/portal.json'),'utf8'));
const activities = JSON.parse(await readFile(path.join(root,'mtaprime/src/data/fixtures/activities.json'),'utf8'));
for (const locale of ['ka','en']) {
  for (const module of modules) await get('content/' + module, locale);
  const resorts = await get('resorts', locale);
  await get('news', locale);
  for (const scope of ['', ...resorts.map(r => r.slug)]) await get('faqs?scope=' + encodeURIComponent(scope), locale);
  for (const resort of resorts) await get('maps/' + resort.slug, locale);
  const messages = JSON.parse(await readFile(path.join(root,'mtaprime/messages/' + locale + '.json'),'utf8'));
  for (const module of ['about','contact','navigation','footer','structure','page-text']) {
    const settings = responses[key('content/' + module, locale)].find(r => r.slug === 'settings');
    Object.assign(messages, settings?.texts || {});
  }
  const resolve = value => Array.isArray(value) ? value.map(resolve) : value && typeof value === 'object'
    ? value.$message ? value.$message.split('.').reduce((o,k) => o?.[k], messages) ?? value.$message
      : Object.fromEntries(Object.entries(value).map(([k,v]) => [k,resolve(v)])) : value;
  responses[key('activities',locale)] = resolve(activities);
  for (const kind of ['closures','avalanches','resortOperations']) responses[key(kind,locale)] = resolve(portal[kind] || []);
}
// Do not publish a frozen observation as a live feed. The existing cards show unavailable.
responses['resorts/conditions'] = [];
const assetDir = path.join(root,'mtaprime/public/published-media');
await mkdir(assetDir,{recursive:true});
for(const [base,tiles] of tilePyramids)for(let level=0;level<=tiles.maxLevel;level++){
  const factor=2**(tiles.maxLevel-level),w=Math.ceil(tiles.width/factor),h=Math.ceil(tiles.height/factor);
  for(let row=0;row<Math.ceil(h/tiles.tileSize);row++)for(let col=0;col<Math.ceil(w/tiles.tileSize);col++)media.add(`${base}/${level}/${col}_${row}.jpg`);
}
async function hashFile(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
for (const url of [...media].sort()) {
  const response = await fetch(new URL(url,origin), {redirect:'error'});
  if (!response.ok) throw new Error('Missing published media: ' + url);
  const relative=url.slice('/media/'.length),target='/published-media/'+relative,assetPath=path.join(assetDir,relative),temp=assetPath+'.tmp';
  await mkdir(path.dirname(assetPath),{recursive:true});
  await pipeline(Readable.fromWeb(response.body),createWriteStream(temp));
  const bytes=(await stat(temp)).size,sha256=await hashFile(temp),existing=await stat(assetPath).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
  if(existing?.size===bytes&&await hashFile(assetPath)===sha256)await unlink(temp);else await rename(temp,assetPath);
  assets.push({url:target,bytes,sha256});
}
const rewrite = value => typeof value === 'string' ? value.replace(/\/media\/(?=[a-z0-9-])/gi,'/published-media/')
  : Array.isArray(value) ? value.map(rewrite) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k,rewrite(v)])) : value;
const snapshot = {version:1,exportedAt:new Date().toISOString(),responses:rewrite(responses),assets};
const serialized = JSON.stringify(snapshot,null,2) + '\n';
if (/https?:\/\/(?:localhost|127\.0\.0\.1)|\/media\//i.test(serialized)) throw new Error('Local-only URL remains in snapshot: ' + (serialized.match(/(?:https?:\/\/(?:localhost|127\.0\.0\.1)|\/media\/)[^"\s]*/gi) || []).join(', '));
const target = path.join(root,'mtaprime/src/data/published-snapshot.json');
await writeFile(target + '.tmp',serialized); await rename(target + '.tmp',target);
console.log('Exported',Object.keys(responses).length,'public responses and',assets.length,'unchanged media files.');
