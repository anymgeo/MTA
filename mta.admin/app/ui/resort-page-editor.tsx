'use client';
import { useId, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { api } from './api';

type Row = Record<string, string>;
const labels: Record<string,string> = {
  about:'კურორტის შესახებ / About',history:'ისტორია / History',facts:'მთავარი ფაქტები / Key facts',arrivalText:'მისასვლელი გზა / Getting there',infrastructureText:'საბაგიროები და ტრასები / Infrastructure',
  logoUrl:'კურორტის ლოგო / Resort logo',bannerImage:'საბაგიროების ფოტო / Infrastructure image',posterUrl:'ვიდეოს პოსტერი / Video poster',pdfUrl:'ტრასების PDF რუკა / PDF trail map',
  name:'სახელი / Name',type:'ტიპი / Type',duration:'მგზავრობის ხანგრძლივობა / Ride duration',hours:'სამუშაო საათები / Hours',length:'სიგრძე / Length',difficulty:'სირთულე / Difficulty',city:'ქალაქი / City',time:'მგზავრობის დრო / Driving time',title:'სათაური / Title',text:'აღწერა / Description',iconKey:'ხატულა / Icon key'
};
export type ResortPageContent = {
  about?: string; history?: string; facts?: string; arrivalText?: string; infrastructureText?: string;
  logoUrl?: string; videoUrl?: string; videoWebmUrl?: string; posterUrl?: string; pdfUrl?: string; bannerImage?: string; purchaseUrl?: string;
  markerX?: string; markerY?: string;
  social?: { resortFacebook?: string; facebook?: string; instagram?: string; tiktok?: string };
  travelTimes?: Row[]; liftList?: Row[]; trailList?: Row[]; activities?: Row[];
};
function Rows({ title, fields, rows, onChange }: { title: string; fields: string[]; rows: Row[]; onChange: (rows: Row[]) => void }) {
  return <details className="resort-details"><summary>{title} ({rows.length})</summary>
    {rows.map((row, index) => <fieldset key={index} className="stack" style={{ margin: '16px 0', padding: 12 }}>
      <legend>{index + 1}</legend>{fields.map(field => <label key={field}>{labels[field] || field}
        {field === 'difficulty' ? <select value={row[field]} onChange={e => onChange(rows.map((r, i) => i === index ? { ...r, [field]: e.target.value } : r))}>
          <option value="easy">Easy / მარტივი</option><option value="medium">Medium / საშუალო</option><option value="difficult">Difficult / რთული</option>
        </select> : <InputText maxLength={2000} value={row[field] || ''} onChange={e => onChange(rows.map((r, i) => i === index ? { ...r, [field]: e.target.value } : r))} />}
      </label>)}<Button type="button" text label="ამოშლა / Remove" onClick={() => onChange(rows.filter((_, i) => i !== index))} />
    </fieldset>)}
    <Button type="button" text label="დამატება / Add" disabled={rows.length >= 100} onClick={() => onChange([...rows, Object.fromEntries(fields.map(f => [f, f === 'difficulty' ? 'easy' : '']))])} />
  </details>;
}
export default function ResortPageEditor({ value, lifts, activities, disabled, onBusy, onChange }: {
  value?: ResortPageContent; lifts: Row[]; activities: Row[]; disabled: boolean;
  onBusy: (busy: boolean) => void; onChange: (page: ResortPageContent) => void;
}) {
  const page = value || {}, id = useId();
  const [error, setError] = useState('');
  function set<K extends keyof ResortPageContent>(key: K, next: ResortPageContent[K]) { onChange({ ...page, [key]: next }); }
  async function upload(file: File | undefined, key: 'logoUrl' | 'bannerImage' | 'pdfUrl' | 'videoUrl' | 'videoWebmUrl' | 'posterUrl') {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Maximum 5 MB'); return; }
    setError(''); onBusy(true);
    try {
      const body = new FormData(); body.set('file', file);
      const result = await api<{url:string}>(key === 'pdfUrl' ? '/admin/resort-pdf' : key === 'videoUrl' || key === 'videoWebmUrl' ? '/admin/resort-video' : '/admin/media', { method: 'POST', body });
      set(key, result.url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { onBusy(false); }
  }
  return <fieldset className="stack" disabled={disabled}><legend>კურორტის გვერდი / Resort page</legend>
    <p className="translation-note">შეავსეთ თითოეული ენა / Edit each language. Empty copy is displayed as “coming soon”.</p>
    {error && <p role="alert">{error}</p>}
    {(['about','history','facts','arrivalText','infrastructureText'] as const).map(key => <label key={key} htmlFor={id+key}>{labels[key]}<InputTextarea id={id+key} rows={3} maxLength={20000} value={page[key] || ''} onChange={e => set(key,e.target.value)} /></label>)}
    {(['logoUrl','bannerImage','posterUrl','pdfUrl'] as const).map(key => <div key={key} className="stack">
      <label htmlFor={id+key}>{labels[key]}</label><InputText id={id+key} value={page[key] || ''} maxLength={2000} onChange={e => set(key,e.target.value)} />
      <input aria-label={`${labels[key]} — ატვირთვა / Upload`} type="file" accept={key === 'pdfUrl' ? 'application/pdf' : 'image/png,image/jpeg,image/webp'} onChange={e => { void upload(e.target.files?.[0], key); e.target.value = ''; }} />
    </div>)}
    {(['videoUrl','videoWebmUrl'] as const).map(key => <div key={key} className="stack">
      <label htmlFor={id+key}>{key === 'videoUrl' ? 'Hero MP4 (H.264) / მთავარი ვიდეო' : 'Optional WebM / დამატებითი WebM'}</label>
      <InputText id={id+key} maxLength={2000} value={page[key] || ''} onChange={e => set(key,e.target.value)} />
      <input aria-label={key === 'videoUrl' ? 'Upload MP4 / MP4 ატვირთვა' : 'Upload WebM / WebM ატვირთვა'} type="file" accept={key === 'videoUrl' ? 'video/mp4' : 'video/webm'} onChange={e => { void upload(e.target.files?.[0],key); e.target.value = ''; }} />
    </div>)}
    <p className="translation-note">Maximum 5 MB per video. Mobile, reduced-motion and data-saver visitors see the poster. WebM is optional; MP4 remains the fallback.</p>
    <label>Skipass purchase URL<InputText maxLength={2000} value={page.purchaseUrl || ''} onChange={e => set('purchaseUrl',e.target.value)} /></label>
    <p className="translation-note">Map marker: percentage position on the illustrated Georgia map (not navigation coordinates).</p>
    {(['markerX','markerY'] as const).map(key => <label key={key}>{key}<InputText type="number" min={0} max={100} step="any" value={page[key] || '50'} onChange={e => set(key,e.target.value)} /></label>)}
    <Rows title="მგზავრობის დრო / Driving times" fields={['city','time']} rows={page.travelTimes || []} onChange={rows => set('travelTimes', rows)} />
    <Rows title="საბაგიროები / Lifts" fields={['name','type','duration','hours']} rows={page.liftList ?? lifts.map(l => ({...l,duration:''}))} onChange={rows => set('liftList', rows)} />
    <Rows title="ტრასები / Trails" fields={['name','length','difficulty']} rows={page.trailList || []} onChange={rows => set('trailList', rows)} />
    <Rows title="აქტივობები / Activities" fields={['title','text','iconKey']} rows={page.activities ?? activities} onChange={rows => set('activities', rows)} />
    <p className="translation-note">Icons: skiing, snowboarding, hiking, mountain-biking, paragliding, camping, food, photography.</p>
    {(['resortFacebook','facebook','instagram','tiktok'] as const).map(key => <label key={key}>{key}<InputText maxLength={2000} value={page.social?.[key] || ''} onChange={e => set('social',{...page.social,[key]:e.target.value})} /></label>)}
  </fieldset>;
}
