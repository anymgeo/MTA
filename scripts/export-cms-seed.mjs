// Export existing editorial content for the one-time database import.
// This script prints JSON; it never overwrites the original fixtures.
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const messages = Object.fromEntries(['ka', 'en'].map(l => [l, JSON.parse(read('mtaprime/messages/' + l + '.json'))]));
const lookup = (locale, key) => key.split('.').reduce((o, k) => o?.[k], messages[locale]) ?? key;
function resolve(value, locale) {
  if (Array.isArray(value)) return value.map(v => resolve(v, locale));
  if (value && typeof value === 'object') return value.$message ? lookup(locale, value.$message) : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, locale)]));
  return value;
}
const rows = [];
function add(module, slug, ka, en, order = 0) {
  rows.push({ module, slug, kaJson: JSON.stringify(ka), enJson: JSON.stringify(en), sortOrder: order, published: true });
}
const portal = JSON.parse(read('mtaprime/src/data/fixtures/portal.json'));
portal.navigation.forEach((item,i)=>add('home-navigation',item.slug,resolve(item,'ka'),resolve(item,'en'),i));
for (const module of ['leadership', 'events', 'history', 'infrastructure', 'documents', 'safety', 'contacts', 'webcams']) {
  portal[module].forEach((item, i) => add(module, item.slug, resolve(item, 'ka'), resolve(item, 'en'), i));
}
JSON.parse(read('mtaprime/src/data/fixtures/projects.json')).forEach((item, i) => add('projects', item.slug, resolve(item, 'ka'), resolve(item, 'en'), i));
const resortFixtures = JSON.parse(read('mtaprime/src/data/fixtures/resorts.json'));
for(const [i,item] of resortFixtures.entries()) {
  if(portal.webcams.some(camera=>camera.areaId===item.slug)) continue;
  const content = Object.fromEntries(['ka','en'].map(locale=>{const resort=resolve(item,locale);return [locale,{title:resort.name,description:'',image:resort.image,areaId:resort.slug,area:resort.region,videoUrl:'',status:'unavailable',sourceType:'image',isLive:false,links:[]}];}));
  add('webcams',item.slug,content.ka,content.en,i+1);
}
for (const namespace of ['AboutPage', 'ContactPage', 'Header', 'Footer', 'StructurePage', 'Portal']) {
  const module = { AboutPage: 'about', ContactPage: 'contact', Header: 'navigation', Footer: 'footer', StructurePage: 'structure', Portal: 'page-text' }[namespace];
  const contents = {};
  for (const locale of ['ka', 'en']) contents[locale] = { title: namespace, description: '', texts: { [namespace]: messages[locale][namespace] } };
  if(module==='page-text')for(const locale of ['ka','en'])for(const name of ['ProjectsPage','projects_Detail','MountainViews','PortalDate'])contents[locale].texts[name]=messages[locale][name];
  if (module === 'contact') for (const locale of ['ka', 'en']) Object.assign(contents[locale], {
    phone: '+995 32 205 30 50', email: 'info@mta.ski', address: lookup(locale, 'ContactPage.2SanapiroStreet_00a581'),
    openTime: '09:00', closeTime: '18:00', latitude: 41.7151, longitude: 44.7772,
    mapUrl: 'https://maps.google.com/maps?q=70%20Merab%20Kostava%20Street%20Tbilisi&output=embed',
    links: [{ label: 'Facebook', url: 'https://www.facebook.com/MountainTrailsAgency' }, { label: 'Instagram', url: 'https://www.instagram.com/m.t.a_mountain_trails_agency/' }]
  });
  if(module==='about') for(const locale of ['ka','en']) Object.assign(contents[locale], {mainText:lookup(locale,'AboutPage.mountainTrailsAgencyIsResponsibleFor_e3fbd5'),historyText:lookup(locale,'AboutPage.ourWorkCoversMountainInfrastructureOperations_b9e9e8')});
  if (module === 'structure') {
    const source = read('scripts/legacy-structure-source.txt');
    const body = source.slice(source.indexOf('function getLocalizedContent(t)'));
    for (const locale of ['ka','en']) contents[locale].structureData = new Function('t', body + '; return getLocalizedContent(t).structureData;')(k => lookup(locale, 'StructurePage.' + k));
  }
  if (module === 'footer') for (const locale of ['ka','en']) {
    contents[locale].links = [ ['/#resorts','resorts_c5a813'], ['/#live','mountainStatus_b7d976'], ['/#map','maps_80071c'], ['/news','news_34c808'] ].map(([url,key]) => ({ url, label: lookup(locale,'Footer.'+key) }));
    contents[locale].socials = [{ label:'Instagram', url:'https://www.instagram.com/m.t.a_mountain_trails_agency/' }, { label:'Facebook', url:'https://www.facebook.com/MountainTrailsAgency' }];
    contents[locale].statusUrl = 'https://status.mta.ski/' + locale;
  }
  add(module, 'settings', contents.ka, contents.en);
}
const nav = [['about','aboutMta_7850e0','/about'],['resorts','resorts_c5a813','/resorts'],['maps','maps_80071c','/#map'],['safety','safety_db6e7e','/safety'],['events','events_c5497b','/events'],['faq','faq','/faq'],['news','news_34c808','/news']];
for (const [i,[slug,key,href]] of nav.entries()) {
  const contents = {};
  for (const locale of ['ka','en']) {
    contents[locale]={title:lookup(locale,'Header.'+key),description:'',href,children:[]};
    if(slug==='about') contents[locale].children=[['/about',lookup(locale,'Header.about_6b21fb')],...['history','leadership','infrastructure','documents'].map(s=>['/about/'+s,lookup(locale,'Portal.titles.'+s)]),['/structure',lookup(locale,'Header.structure_9482c5')],['/contact',lookup(locale,'Header.contact_b37456')],['/projects',lookup(locale,'Header.projects_53e890')]].map(([href,title])=>({href,title}));
    if(slug==='safety') contents[locale].children=[['/safety',lookup(locale,'Portal.overview')],...['code-of-conduct','piste-classification','mountain-patrol','emergency-contacts','closures','avalanche-danger','freeride-rules','incident'].map(s=>['/safety/'+s,lookup(locale,'Portal.titles.'+s)])].map(([href,title])=>({href,title}));
  }
  add('navigation',slug,contents.ka,contents.en,i+1);
}
process.stdout.write(JSON.stringify(rows, null, 2));
