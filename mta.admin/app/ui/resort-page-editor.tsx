'use client';
import { useId, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { api } from './api';
import { DurationSelect, HoursSelect, liftTypes } from './time-controls';

type Row = Record<string, string>;
type Transport = { car: string; transfer: string; routeUrl: string };
const labels: Record<string,string> = {
  about:'კურორტის შესახებ / About',history:'ისტორია / History',facts:'მთავარი ფაქტები / Key facts',arrivalText:'მისასვლელი გზა / Getting there',infrastructureText:'საბაგიროები და ტრასები / Infrastructure',
  logoUrl:'კურორტის ლოგო / Resort logo',bannerImage:'საბაგიროების ფოტო / Infrastructure image',posterUrl:'ვიდეოს პოსტერი / Video poster',pdfUrl:'ტრასების PDF რუკა / PDF trail map',
  name:'სახელი / Name',type:'ტიპი / Type',duration:'მგზავრობის ხანგრძლივობა / Ride duration',hours:'სამუშაო საათები / Hours',length:'სიგრძე / Length',difficulty:'სირთულე / Difficulty',city:'ქალაქი / City',time:'მგზავრობის დრო / Driving time',title:'სათაური / Title',text:'აღწერა / Description',iconKey:'ხატულა / Icon key'
};
const difficulties=[{label:'Easy / მარტივი',value:'easy'},{label:'Medium / საშუალო',value:'medium'},{label:'Difficult / რთული',value:'difficult'}];
const iconOptions=['skiing','snowboarding','hiking','mountain-biking','paragliding','camping','food','photography'].map(value=>({label:value.replace('-', ' '),value}));
export type ResortPageContent = {
  about?: string; history?: string; facts?: string; arrivalText?: string; infrastructureText?: string;
  logoUrl?: string; videoUrl?: string; videoWebmUrl?: string; posterUrl?: string; pdfUrl?: string; bannerImage?: string; purchaseUrl?: string;
  markerX?: string; markerY?: string;
  social?: { resortFacebook?: string; facebook?: string; instagram?: string; tiktok?: string };
  travelTimes?: Row[]; liftList?: Row[]; trailList?: Row[]; activities?: Row[];
};

function Section({id,step,title,note,children}:{id:string;step:string;title:string;note:string;children:React.ReactNode}){
  return <section id={id} className="premium-card"><header><span>{step}</span><div><h2>{title}</h2><p>{note}</p></div></header><div className="premium-card-body">{children}</div></section>;
}
function Field({label,hint,children}:{label:string;hint?:string;children:React.ReactNode}){return <label><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
function Rows({title,emptyText,fields,rows,locale,onChange}:{title:string;emptyText:string;fields:string[];rows:Row[];locale:'ka'|'en';onChange:(rows:Row[])=>void}){
  const typeOptions=liftTypes[locale].map(value=>({label:value,value}));
  function update(index:number,field:string,value:string){onChange(rows.map((row,i)=>i===index?{...row,[field]:value}:row));}
  return <div className="collection-editor"><div className="collection-heading"><div><h3>{title}</h3><p>{rows.length} item{rows.length===1?'':'s'}</p></div><Button type="button" outlined icon="pi pi-plus" label="დამატება / Add" disabled={rows.length>=100} onClick={()=>onChange([...rows,Object.fromEntries(fields.map(field=>[field,field==='difficulty'?'easy':field==='type'?liftTypes[locale][0]:'']))])}/></div>
    {!rows.length&&<div className="premium-empty compact"><i className="pi pi-inbox"/><h3>{emptyText}</h3><p>Add the first item to start building this section.</p></div>}
    <div className="collection-list">{rows.map((row,index)=><article className="collection-row" key={index}><div className="collection-index">{String(index+1).padStart(2,'0')}</div><div className="premium-grid two">{fields.map(field=><Field key={field} label={labels[field]||field}>{field==='hours'?<HoursSelect value={row[field]||''} onChange={value=>update(index,field,value)}/>:field==='duration'||field==='time'?<DurationSelect travel={field==='time'} value={row[field]||''} onChange={value=>update(index,field,value)}/>:field==='type'?<Dropdown className="premium-dropdown" options={typeOptions} value={row[field]||typeOptions[0]?.value} onChange={e=>update(index,field,e.value)}/>:field==='difficulty'?<Dropdown className="premium-dropdown" options={difficulties} value={row[field]||'easy'} onChange={e=>update(index,field,e.value)}/>:field==='iconKey'?<Dropdown className="premium-dropdown" options={iconOptions} value={row[field]||''} placeholder="Choose icon" showClear onChange={e=>update(index,field,e.value||'')}/>:<InputText maxLength={2000} value={row[field]||''} onChange={e=>update(index,field,e.target.value)}/>}</Field>)}</div><Button type="button" rounded text severity="danger" icon="pi pi-trash" aria-label="Remove item" onClick={()=>onChange(rows.filter((_,i)=>i!==index))}/></article>)}</div>
  </div>;
}

export default function ResortPageEditor({value,lifts,activities,locale,disabled,onBusy,onChange,transport,onTransportChange,mapSlot}:{
  value?:ResortPageContent;lifts:Row[];activities:Row[];disabled:boolean;locale:'ka'|'en';onBusy:(busy:boolean)=>void;onChange:(page:ResortPageContent)=>void;transport:Transport;onTransportChange:(transport:Transport)=>void;mapSlot:React.ReactNode;
}){
  const page=value||{},id=useId();const [error,setError]=useState('');
  function set<K extends keyof ResortPageContent>(key:K,next:ResortPageContent[K]){onChange({...page,[key]:next});}
  async function upload(file:File|undefined,key:'logoUrl'|'bannerImage'|'pdfUrl'|'videoUrl'|'videoWebmUrl'|'posterUrl'){
    if(!file)return;if(file.size>5*1024*1024){setError('Maximum file size is 5 MB.');return;}setError('');onBusy(true);
    try{const body=new FormData();body.set('file',file);const result=await api<{url:string}>(key==='pdfUrl'?'/admin/resort-pdf':key==='videoUrl'||key==='videoWebmUrl'?'/admin/resort-video':'/admin/media',{method:'POST',body});set(key,result.url);}catch(e){setError(e instanceof Error?e.message:'Upload failed');}finally{onBusy(false);}
  }
  const textFields=(keys:(keyof ResortPageContent)[])=>keys.map(key=><Field key={String(key)} label={labels[String(key)]}><InputTextarea id={id+String(key)} rows={4} maxLength={20000} value={String(page[key]||'')} onChange={e=>set(key,e.target.value as never)}/></Field>);
  return <fieldset className="resort-page-sections" disabled={disabled}>
    {error&&<div className="editor-banner error" role="alert"><i className="pi pi-exclamation-circle"/>{error}</div>}
    <Section id="content" step="04" title="About & history" note={`Long-form resort content · ${locale.toUpperCase()}`}><p className="translation-note">Use the language switch above to edit the matching Georgian or English copy.</p>{textFields(['about','history','facts'])}</Section>
    <Section id="infrastructure" step="05" title="Lifts & trails" note="Manage infrastructure copy and structured lists.">{textFields(['infrastructureText'])}<Rows locale={locale} title="საბაგიროები / Lifts" emptyText="No lifts added yet" fields={['name','type','duration','hours']} rows={page.liftList??lifts.map(row=>({...row,duration:''}))} onChange={rows=>set('liftList',rows)}/><Rows locale={locale} title="ტრასები / Trails" emptyText="No trails added yet" fields={['name','length','difficulty']} rows={page.trailList||[]} onChange={rows=>set('trailList',rows)}/><MediaField label={labels.bannerImage} value={page.bannerImage||''} accept="image/png,image/jpeg,image/webp" onText={value=>set('bannerImage',value)} onUpload={file=>upload(file,'bannerImage')}/></Section>
    <Section id="activities" step="06" title="Activities" note="A clean, icon-led list of things visitors can do."><Rows locale={locale} title="აქტივობები / Activities" emptyText="No activities added yet" fields={['title','text','iconKey']} rows={page.activities??activities} onChange={rows=>set('activities',rows)}/></Section>
    <Section id="travel" step="07" title="Travel & directions" note="Getting-there copy, city travel times and illustrated-map marker.">{textFields(['arrivalText'])}<div className="premium-grid two"><Field label="By car / მანქანით"><InputTextarea rows={3} value={transport.car} maxLength={5000} onChange={e=>onTransportChange({...transport,car:e.target.value})}/></Field><Field label="Transfer / ტრანსფერი"><InputTextarea rows={3} value={transport.transfer} maxLength={5000} onChange={e=>onTransportChange({...transport,transfer:e.target.value})}/></Field></div><Field label="Directions URL"><InputText value={transport.routeUrl} maxLength={2000} onChange={e=>onTransportChange({...transport,routeUrl:e.target.value})}/></Field><Rows locale={locale} title="მგზავრობის დრო / Driving times" emptyText="No city travel times yet" fields={['city','time']} rows={page.travelTimes||[]} onChange={rows=>set('travelTimes',rows)}/><div className="premium-grid two"><Field label="Map marker X (%)" hint="Position on the illustrated Georgia map."><InputText type="number" min={0} max={100} step="any" value={page.markerX||'50'} onChange={e=>set('markerX',e.target.value)}/></Field><Field label="Map marker Y (%)"><InputText type="number" min={0} max={100} step="any" value={page.markerY||'50'} onChange={e=>set('markerY',e.target.value)}/></Field></div></Section>
    {mapSlot}
    <Section id="publishing" step="09" title="Publishing & social" note="Hero assets, downloadable map, purchase link and social destinations."><div className="subsection-heading"><div><h3>Resort identity & hero</h3><p>Files are shared where appropriate; text remains language-specific.</p></div></div><div className="premium-grid two"><MediaField label={labels.logoUrl} value={page.logoUrl||''} accept="image/png,image/jpeg,image/webp,image/svg+xml" onText={value=>set('logoUrl',value)} onUpload={file=>upload(file,'logoUrl')}/><MediaField label={labels.posterUrl} value={page.posterUrl||''} accept="image/png,image/jpeg,image/webp" onText={value=>set('posterUrl',value)} onUpload={file=>upload(file,'posterUrl')}/><MediaField label="Hero MP4 (H.264)" value={page.videoUrl||''} accept="video/mp4" onText={value=>set('videoUrl',value)} onUpload={file=>upload(file,'videoUrl')}/><MediaField label="Optional hero WebM" value={page.videoWebmUrl||''} accept="video/webm" onText={value=>set('videoWebmUrl',value)} onUpload={file=>upload(file,'videoWebmUrl')}/></div><p className="translation-note">Maximum 5 MB per file. Reduced-motion and data-saver visitors see the poster.</p><div className="premium-grid two"><MediaField label={labels.pdfUrl} value={page.pdfUrl||''} accept="application/pdf" onText={value=>set('pdfUrl',value)} onUpload={file=>upload(file,'pdfUrl')}/><Field label="Skipass purchase URL"><InputText maxLength={2000} value={page.purchaseUrl||''} onChange={e=>set('purchaseUrl',e.target.value)}/></Field></div><div className="premium-grid two">{(['resortFacebook','facebook','instagram','tiktok'] as const).map(key=><Field key={key} label={key.replace(/([A-Z])/g,' $1')}><InputText maxLength={2000} value={page.social?.[key]||''} onChange={e=>set('social',{...page.social,[key]:e.target.value})}/></Field>)}</div></Section>
  </fieldset>;
}

function MediaField({label,value,accept,onText,onUpload}:{label:string;value:string;accept:string;onText:(value:string)=>void;onUpload:(file:File|undefined)=>void}){
  const id=useId();return <div className="media-field"><Field label={label}><InputText value={value} maxLength={2000} onChange={e=>onText(e.target.value)}/></Field><label className="upload-button" htmlFor={id}><i className="pi pi-upload"/> Upload file</label><input id={id} className="file-input" type="file" accept={accept} onChange={e=>{onUpload(e.target.files?.[0]);e.target.value='';}}/></div>;
}
