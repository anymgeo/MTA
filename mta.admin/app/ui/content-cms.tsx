'use client';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { api, ApiError, type Session } from './api';
import RichCopy from './rich-copy';

type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
type ObjectValue = { [key: string]: Value };
type RecordRow = { id: string; module: string; slug: string; kaJson: string; enJson: string; published: boolean; sortOrder: number; version: string; createdBy: string; createdAt: string; updatedBy: string; updatedAt: string };
type Revision = { id: number; actor: string; action: string; at: string };
export const cmsModules = [
  ['leadership','ხელმძღვანელობა / Leadership'], ['events','ღონისძიებები / Events'], ['contact','კონტაქტი / Contact'],
  ['about','სააგენტოს შესახებ / About'], ['history','ისტორია / History'], ['infrastructure','ინფრასტრუქტურა / Infrastructure'],
  ['documents','დოკუმენტები / Documents'], ['safety','უსაფრთხოება / Safety'], ['contacts','საგანგებო კონტაქტები / Emergency contacts'],
  ['webcams','კამერები / Webcams'], ['projects','პროექტები / Projects'], ['structure','სტრუქტურა / Structure'],
  ['navigation','ნავიგაცია / Navigation'], ['home-navigation','მთავარი გვერდის ბმულები / Homepage links'], ['footer','Footer'], ['page-text','გვერდების ტექსტები / Page labels'], ['messages','შეტყობინებები / Messages']
];
const times = Array.from({length:48}, (_,i) => `${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`);
const labels: Record<string,string> = { title:'სახელი / სათაური · Name / title', description:'აღწერა · Description', position:'თანამდებობა · Position', image:'ფოტო · Photo', phone:'ტელეფონი · Phone', email:'ელფოსტა · Email', address:'მისამართი · Address', openTime:'გახსნის დრო · Opening', closeTime:'დახურვის დრო · Closing', areaId:'კურორტი · Resort', startAt:'დაწყება · Start', endAt:'დასასრული · End', publishedAt:'გამოქვეყნების თარიღი · Publication date', files:'დოკუმენტები · Documents', links:'ბმულები · Links', blocks:'კონტენტი · Content blocks', texts:'გვერდის ტექსტები · Page copy', structureData:'დეპარტამენტები · Organization', videoUrl:'ვიდეო / სტრიმი · Video / stream', mapUrl:'ოფისის რუკა · Office map', schedule:'განრიგი · Schedule', participants:'მონაწილეები · Participants', results:'შედეგები · Results', changes:'ცვლილებები · Changes', media:'მედია · Media', images:'ფოტოები · Images', gallery:'გალერეა · Gallery', specs:'მახასიათებლები · Specifications', status:'სტატუსი · Status', category:'კატეგორია · Category', latitude:'განედი · Latitude', longitude:'გრძედი · Longitude' };
const common = { title:'', description:'', image:'', blocks:[], links:[] };
const templates: Record<string,ObjectValue> = {
 leadership:{...common, position:'', email:'', linkedinUrl:''},
 events:{...common, areaId:'all', area:'', location:'', category:'', type:'', status:'upcoming', startAt:'', endAt:'', schedule:[], participants:[], changes:[], results:[], media:[], files:[]},
 documents:{...common, category:'', files:[]}, contacts:{title:'',description:'',phone:'',areaId:'all',links:[]},
 webcams:{...common, areaId:'all',area:'',videoUrl:'',status:'active',sourceType:'embed',isLive:false},
 navigation:{title:'',description:'',href:'',children:[]},
 about:{...common},
 projects:{...common, resort:'',resortId:'all',category:'',date:'',year:new Date().getFullYear(),overview:'',gallery:[],activities:[],highlights:[],stats:[],files:[],links:[],status:'unknown'},
};
function blankValue(v: Value): Value {
 if (Array.isArray(v)) return [];
 if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k,val]) => [k, k === 'mimeType' ? 'application/pdf' : blankValue(val)]));
 return typeof v === 'number' ? 0 : typeof v === 'boolean' ? false : '';
}
function DateSelect({value,onChange}: {value:string;onChange:(v:string)=>void}) {
 const date = value ? new Date(value) : null;
 const parts = date && !isNaN(+date) ? [date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),date.toISOString().slice(11,16)] : [new Date().getFullYear(),1,1,'09:00'];
 const update = (index:number, next:string|number) => {
  const p=[...parts]; p[index]=next; const [h,m]=String(p[3]).split(':').map(Number);
  const result = new Date(Date.UTC(Number(p[0]),Number(p[1])-1,Number(p[2]),h,m));
  if(result.getUTCMonth()!==Number(p[1])-1) result.setUTCDate(0);
  onChange(result.toISOString());
 };
 return <div className="cms-date"><Dropdown aria-label="წელი / Year" value={parts[0]} options={Array.from({length:81},(_,i)=>1980+i)} onChange={e=>update(0,e.value)} /><Dropdown aria-label="თვე / Month" value={parts[1]} options={Array.from({length:12},(_,i)=>i+1)} onChange={e=>update(1,e.value)} /><Dropdown aria-label="დღე / Day" value={parts[2]} options={Array.from({length:31},(_,i)=>i+1)} onChange={e=>update(2,e.value)} /><Dropdown aria-label="დრო / Time (UTC)" value={parts[3]} options={times} onChange={e=>update(3,e.value)} /><Button type="button" text label="გასუფთავება / Clear" onClick={()=>onChange('')} /></div>;
}
function Fields({value,onChange,path='content',schema,errors={}}: {value:ObjectValue;onChange:(v:ObjectValue)=>void;path?:string;schema?:ObjectValue;errors?:Record<string,string[]>}) {
 return <div className="cms-fields">{Object.entries(value).filter(([k])=>!['id','slug','sortOrder','updatedAt'].includes(k)).map(([key,v]) => {
  const name=labels[key] || key.replace(/([A-Z])/g,' $1').replace(/_/g,' ');
  const change=(n:Value)=>onChange({...value,[key]:n}); const id=path+'.'+key;
  if(Array.isArray(v)) {
   const prototype = (schema?.[key] as Value[] | undefined)?.[0] ?? v[0] ?? (['files'].includes(key)?{name:'',url:'',mimeType:'application/pdf'}:['links','socials'].includes(key)?{label:'',url:''}:['blocks','schedule','participants','changes','results','media'].includes(key)?{title:'',text:''}:['specs','stats'].includes(key)?{label:'',value:''}:key==='children'?{title:'',href:''}:'');
   return <details key={key} className="cms-accordion"><summary>{name}<span>{v.length}</span></summary><div className="cms-array">{v.map((item,i)=><div className="cms-array-item" key={i}><div className="cms-array-actions"><span>{i+1}</span><Button type="button" text icon="pi pi-arrow-up" aria-label="Move up" disabled={i===0} onClick={()=>{const a=[...v]; [a[i-1],a[i]]=[a[i],a[i-1]];change(a);}}/><Button type="button" text icon="pi pi-trash" aria-label="Remove item" onClick={()=>change(v.filter((_,n)=>n!==i))}/></div>{item && typeof item==='object' && !Array.isArray(item)?<Fields value={item} schema={prototype as ObjectValue} onChange={n=>change(v.map((x,j)=>j===i?n:x))} path={id+'.'+i} errors={errors}/>:<div><InputText aria-label={`${name} ${i+1}`} value={String(item??'')} onChange={e=>change(v.map((x,j)=>j===i?e.target.value:x))}/>{['gallery','images'].includes(key)&&<Upload kind="image" onUploaded={url=>change(v.map((x,j)=>j===i?url:x))}/>}</div>}</div>)}<Button type="button" outlined label="დამატება / Add" icon="pi pi-plus" onClick={()=>change([...v,blankValue(prototype)])}/></div></details>;
  }
  if(v && typeof v==='object') return <details key={key} className="cms-accordion"><summary>{name}</summary><Fields value={v} schema={schema?.[key] as ObjectValue} onChange={change} path={id} errors={errors}/></details>;
  if(!path.includes('.texts.')&&['startAt','endAt','publishedAt','date'].includes(key)) return <label key={key}>{name}<DateSelect value={String(v??'')} onChange={n=>change(key==='date'?n.slice(0,10):n)}/><small>UTC · თბილისის დრო = UTC + 4 საათი</small></label>;
  if(!path.includes('.texts.')&&['openTime','closeTime','areaId','resortId','difficulty','liftType','duration','month','year','sourceType'].includes(key)) {
   const options = ['openTime','closeTime'].includes(key)?times:['areaId','resortId'].includes(key)?[{label:'General / საერთო',value:'all'},...['bakuriani','gudauri-kobi','mestia','goderdzi'].map(x=>({label:x,value:x}))]:key==='difficulty'?['easy','medium','difficult']:key==='liftType'?['gondola','chairlift','drag-lift']:key==='duration'?[2,5,10,15,20,30]:key==='sourceType'?['embed','video','image']:key==='year'?Array.from({length:81},(_,i)=>1980+i):Array.from({length:12},(_,i)=>i+1);
   return <label key={key} htmlFor={id}>{name}<Dropdown inputId={id} value={v} options={options} onChange={e=>change(e.value)}/></label>;
  }
  if(typeof v==='number') return <label key={key} htmlFor={id}>{name}<InputNumber inputId={id} value={v} onValueChange={e=>change(e.value??0)} maxFractionDigits={6}/></label>;
  if(typeof v==='boolean') return <label key={key}><input type="checkbox" checked={v} onChange={e=>change(e.target.checked)}/>{name}</label>;
  const upload = ['image','url','videoUrl'].includes(key) || /logo|poster|cover/i.test(key);
  if(['text','description','overview','bio','mainText','historyText'].includes(key) && !path.includes('.texts.')) return <details key={key} className="cms-accordion"><summary>{name}</summary><RichCopy id={id} value={String(v??'')} onChange={change}/></details>;
  return <label key={key} htmlFor={id}>{name}{key==='title'?' *':''}{['text','description','overview','bio','mainText','historyText'].includes(key)||String(v??'').length>150?<InputTextarea id={id} value={String(v??'')} onChange={e=>change(e.target.value)} rows={4}/>:<InputText id={id} invalid={!!errors[id]} aria-invalid={!!errors[id]} type={key==='email'?'email':'text'} value={String(v??'')} onChange={e=>change(e.target.value)} required={key==='title'}/>} {errors[id]&&<small role="alert">{errors[id].join(' ')}</small>}{key==='image'&&v&&<img className="cms-photo" src={String(v)} alt="Preview"/>} {upload&&<Upload onUploaded={change} kind={key==='videoUrl'?'video':value.mimeType==='application/pdf'?'pdf':'image'}/>}</label>;
 })}</div>;
}
function Upload({onUploaded,kind}:{onUploaded:(v:string)=>void;kind:string}) {
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 return <div className="cms-upload"><label>{busy?'იტვირთება… / Uploading…':'ატვირთვა / Upload'}<input disabled={busy} type="file" accept={kind==='pdf'?'application/pdf':kind==='video'?'video/mp4,video/webm':'image/jpeg,image/png,image/webp'} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{const f=new FormData();f.append('file',file);const r=await api<{url:string}>('/admin/'+(kind==='pdf'?'resort-pdf':kind==='video'?'resort-video':'media'),{method:'POST',body:f});onUploaded(r.url);}catch(e){setError(e instanceof Error?e.message:'Upload failed');}finally{setBusy(false);}}}/></label>{error&&<span role="alert">{error}</span>}</div>;
}
export default function ContentCms({module,session}:{module:string;session:Session}) {
 const [rows,setRows]=useState<RecordRow[]>([]);const [loading,setLoading]=useState(true);const [editing,setEditing]=useState<RecordRow|null>(null);
 const [ka,setKa]=useState<ObjectValue>({});const [en,setEn]=useState<ObjectValue>({});const [language,setLanguage]=useState('ka');const [dirty,setDirty]=useState(false);
 const [fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({});const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [history,setHistory]=useState<Revision[]>([]);
 const title=cmsModules.find(x=>x[0]===module)?.[1]??module;
 const load=async()=>{setLoading(true);try{setRows(await api<RecordRow[]>('/admin/content/'+module));}catch(e){setError(e instanceof Error?e.message:'Load failed');}finally{setLoading(false);}};
 useEffect(()=>{let active=true;api<RecordRow[]>('/admin/content/'+module).then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[module]);
 useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty)e.preventDefault();};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
 useEffect(()=>{const handler=(e:MouseEvent)=>{const t=e.target as HTMLElement;if(dirty&&(t.closest('a')||t.closest('.nav-item'))&&!window.confirm('შეუნახავი ცვლილებები / Discard unsaved changes?')){e.preventDefault();e.stopPropagation();}};document.addEventListener('click',handler,true);return()=>document.removeEventListener('click',handler,true);},[dirty]);
 async function open(row:RecordRow){setEditing(row);setKa({...templates[module],...JSON.parse(row.kaJson)});setEn({...templates[module],...JSON.parse(row.enJson)});setDirty(false);setError('');setHistory(row.id?await api<Revision[]>(`/admin/content/${module}/${row.id}/history`):[]);}
 async function save(){if(!editing)return;setBusy(true);setError('');setFieldErrors({});try{const saved=await api<RecordRow>(`/admin/content/${module}${editing.id?'/'+editing.id:''}`,{method:editing.id?'PUT':'POST',body:JSON.stringify({slug:editing.slug,ka,en,sortOrder:editing.sortOrder,published:editing.published,version:editing.version||null})});setDirty(false);setNotice('შენახულია / Saved');await open(saved);await load();}catch(e){setError(e instanceof Error?e.message:'Save failed');if(e instanceof ApiError)setFieldErrors(e.fields);}finally{setBusy(false);}}
 async function order(row:RecordRow,delta:number){setError('');const list=[...rows];const index=list.findIndex(x=>x.id===row.id);const next=index+delta;if(next<0||next>=list.length)return;[list[index],list[next]]=[list[next],list[index]];try{await api('/admin/content/'+module+'/reorder',{method:'PUT',body:JSON.stringify(list.map(x=>({id:x.id,version:x.version})))});await load();}catch(e){setError(e instanceof Error?e.message:'Reorder failed');}}
 return <section className="cms-module"><div className="page-heading"><div><span className="eyebrow">კონტენტის მართვა / CMS</span><h1>{title}</h1><p className="muted">ქართული და ინგლისური · გამოქვეყნება · ცვლილებების ისტორია</p></div>{!editing&&!['contact','about','structure','footer','page-text'].includes(module)&&<Button label="დამატება / Add" icon="pi pi-plus" onClick={()=>{const template=templates[module]??(rows[0]?blankValue(JSON.parse(rows[0].kaJson)):common);void open({id:'',module,slug:'',kaJson:JSON.stringify(template),enJson:JSON.stringify(template),sortOrder:(rows.at(-1)?.sortOrder??-1)+1,published:false,version:'',createdBy:'',createdAt:'',updatedBy:'',updatedAt:''});}}/>}</div>
 {error&&<div className="cms-feedback error" role="alert">{error}</div>}{notice&&<div className="cms-feedback" role="status">{notice}</div>}
 {editing?<><div className="cms-savebar"><Button outlined label="უკან / Back" onClick={()=>{if(!dirty||confirm('შეუნახავი ცვლილებები / Discard unsaved changes?')){setEditing(null);setDirty(false);}}}/><span>{dirty?'შეუნახავი ცვლილებები / Unsaved changes':'შენახულია / Saved'}</span><Button label="შენახვა / Save" loading={busy} onClick={()=>void save()}/></div><div className="cms-settings"><label>მისამართი / Slug *<InputText value={editing.slug} invalid={!!fieldErrors.slug} disabled={!!editing.id} onChange={e=>{setEditing({...editing,slug:e.target.value});setDirty(true);}}/></label><label>რიგითობა / Display order<InputNumber value={editing.sortOrder} onValueChange={e=>{setEditing({...editing,sortOrder:e.value??0});setDirty(true);}}/></label><label><input type="checkbox" checked={editing.published} onChange={e=>{setEditing({...editing,published:e.target.checked});setDirty(true);}}/>გამოქვეყნებული / Published</label></div><div className="cms-language">{[['ka','ქართული'],['en','English']].map(([key,label])=><button type="button" key={key} aria-pressed={language===key} onClick={()=>setLanguage(key)}>{label}</button>)}</div><Fields value={language==='ka'?ka:en} schema={templates[module]} path={language} errors={fieldErrors} onChange={value=>{if(language==='ka')setKa(value);else setEn(value);setDirty(true);}}/><details className="cms-accordion"><summary>ისტორია / Audit history</summary><p>Created: {editing.createdBy} · {editing.createdAt}</p><p>Edited: {editing.updatedBy} · {editing.updatedAt}</p>{history.map(h=><p key={h.id}>{h.actor} · {h.action} · {new Date(h.at).toLocaleString('ka-GE',{timeZone:'Asia/Tbilisi'})}</p>)}</details></>:loading?<p role="status">იტვირთება… / Loading…</p>:<div className="cms-list">{rows.length===0&&<p className="empty">ჯერ ჩანაწერები არ არის / No records yet</p>}{rows.map(row=><article key={row.id} className="cms-row"><div><strong>{JSON.parse(row.kaJson).title||row.slug}</strong><small>{row.published?'გამოქვეყნებული / Published':'დამალული / Hidden'} · {row.slug}</small></div><Button text icon="pi pi-arrow-up" aria-label="Move earlier" onClick={()=>void order(row,-1)}/><Button text icon="pi pi-arrow-down" aria-label="Move later" onClick={()=>void order(row,1)}/><Button outlined label="რედაქტირება / Edit" onClick={()=>void open(row)}/>{session.role==='WebPortalAdmin'&&<Button text severity="danger" icon="pi pi-trash" aria-label="Delete" onClick={async()=>{if(!confirm('წაიშალოს? / Delete?'))return;try{await api(`/admin/content/${module}/${row.id}?version=${row.version}`,{method:'DELETE'});await load();}catch(e){setError(e instanceof Error?e.message:'Delete failed');}}}/>}</article>)}</div>}
 </section>;
}
type InboxMessage = {id:string;name:string;email:string;phone:string;subject:string;message:string;read:boolean;submittedAt:string};
export function Messages({session}:{session:Session}) {
 const [rows,setRows]=useState<InboxMessage[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
 const load=async()=>{try{setRows(await api<InboxMessage[]>('/admin/messages'));}catch(e){setError(e instanceof Error?e.message:'Load failed');}finally{setLoading(false);}};
 useEffect(()=>{let active=true;api<InboxMessage[]>('/admin/messages').then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 return <section className="cms-module"><div className="page-heading"><h1>შეტყობინებები / Messages</h1><Button outlined icon="pi pi-refresh" label="განახლება / Refresh" onClick={()=>void load()}/></div>{error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading…</p>}{!loading&&!rows.length&&<p className="empty">შეტყობინებები არ არის / Your inbox is empty.</p>}{rows.map(m=><details className="cms-accordion" key={m.id}><summary>{!m.read?'● ':''}{m.name} · {m.subject}<span>{new Date(m.submittedAt).toLocaleString('ka-GE',{timeZone:'Asia/Tbilisi'})}</span></summary><p>{m.email} · {m.phone}</p><p style={{whiteSpace:'pre-wrap'}}>{m.message}</p><div className="row-actions"><Button outlined label={m.read?'მოუკითხავი / Mark unread':'წაკითხული / Mark read'} onClick={async()=>{try{await api('/admin/messages/'+m.id,{method:'PUT',body:JSON.stringify({read:!m.read})});await load();}catch(e){setError(e instanceof Error?e.message:'Update failed');}}}/>{session.role==='WebPortalAdmin'&&<Button severity="danger" outlined label="წაშლა / Delete" onClick={async()=>{if(!confirm('Delete message?'))return;try{await api('/admin/messages/'+m.id,{method:'DELETE'});await load();}catch(e){setError(e instanceof Error?e.message:'Delete failed');}}}/>}</div></details>)}</section>;
}
