'use client';
import { useEffect, useId, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { api } from './api';
import ResortPageEditor, { type ResortPageContent } from './resort-page-editor';

type Media = { image: string; heroImages: string[] };
type LiveCardSettings = { winterImage?: string; summerImage?: string; imageAlt?: string; note?: string; featured?: boolean; homepageVisible?: boolean; displayOrder?: number };
const conditionLabels = {"status":"სტატუსი / Status","temperature":"ტემპერატურა / Temperature","weatherCondition":"ამინდი / Weather","snowDepthCm":"თოვლი (სმ) / Snow","newSnow24hCm":"ახალი თოვლი (24სთ) / New snow","liftsOpen":"ღია საბაგიროები / Open lifts","liftsTotal":"სულ საბაგიროები / Total lifts","trailsOpen":"ღია ტრასები / Open trails","trailsTotal":"სულ ტრასები / Total trails","windSpeedKmh":"ქარის სიჩქარე / Wind speed","windDirection":"ქარის მიმართულება / Wind direction","visibility":"ხილვადობა / Visibility","operatingFrom":"გახსნა / Opens","operatingTo":"დახურვა / Closes","topElevationM":"სიმაღლე (მ) / Elevation","lastUpdatedAt":"ბოლო განახლება / Updated"};
type Conditions = { resortId: string; status: string; temperature: number | null; weatherCondition: string | null; snowDepthCm: number | null; newSnow24hCm: number | null; liftsOpen: number | null; liftsTotal: number | null; trailsOpen: number | null; trailsTotal: number | null; windSpeedKmh: number | null; windDirection: string | null; visibility: string | null; operatingFrom: string | null; operatingTo: string | null; topElevationM: number | null; lastUpdatedAt: string | null };
type ResortContent = {
  page?: ResortPageContent;
  liveCard?: LiveCardSettings;
  name: string; region: string; description: string; image: string; summerImage: string;
  lifts: string; trails: string; temp: string; snow: string; newSnow: string; wind: string;
  hours: string; elevation: string; highestPoint: string; pistes: string; winterSeason: string;
  heroImages: string[]; gallery: string[]; seasons?: { winter: Media; summer: Media };
  transport: { car: string; transfer: string; routeUrl: string };
  liftList: { name: string; type: string; hours: string }[];
  trailDifficulty: { label: string; value: number; description: string }[];
  experience: { winter: { title: string; text: string; iconKey: string }[]; summer: { title: string; text: string; iconKey: string }[] };
};
type Resort = { id: string; slug: string; status: string; version: string; liveManaged?: boolean; ka: ResortContent; en: ResortContent };
const statusOptions = [{ label: 'ღიაა', value: 'OPEN' }, { label: 'შეზღუდულია', value: 'LIMITED' }, { label: 'დახურულია', value: 'CLOSED' }];
const infoFields = [
  ['lifts', 'საბაგიროები'], ['trails', 'ტრასები'], ['temp', 'ტემპერატურა'], ['snow', 'თოვლი'], ['newSnow', 'ახალი თოვლი'], ['wind', 'ქარი'],
  ['hours', 'სამუშაო საათები'], ['elevation', 'სიმაღლე'], ['highestPoint', 'უმაღლესი წერტილი'], ['pistes', 'ტრასების სიგრძე'], ['winterSeason', 'ზამთრის სეზონი'],
] as const;
function blankContent(): ResortContent { return { name: '', region: '', description: '', image: '', summerImage: '', lifts: '—', trails: '—', temp: '—', snow: '—', newSnow: '—', wind: '—', hours: '—', elevation: '—', highestPoint: '—', pistes: '—', winterSeason: '—', heroImages: [], gallery: [], liftList: [], trailDifficulty: [], experience: { winter: [], summer: [] }, transport: { car: '', transfer: '', routeUrl: '' } }; }
function preview(path: string) { return path.startsWith('/media/') ? path : '/assets' + path; }

export default function Resorts({ siteUrl }: { siteUrl: string }) {
  const [rows, setRows] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Resort | null>(null);
  const [deleting, setDeleting] = useState<Resort | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function refresh() {
    setLoading(true);
    try { setRows(await api<Resort[]>('/admin/resorts')); }
    catch (e) { setError(e instanceof Error ? e.message : 'კურორტები ვერ ჩაიტვირთა.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    api<Resort[]>('/admin/resorts').then(data => { if (active) setRows(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'კურორტები ვერ ჩაიტვირთა.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function remove() {
    if (!deleting) return; setBusy(true); setError('');
    try { await api(`/admin/resorts/${deleting.id}?version=${deleting.version}`, { method: 'DELETE' }); setDeleting(null); setNotice('კურორტი წაიშალა და საიტის სიიდან მოიხსნა.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'წაშლა ვერ მოხერხდა.'); setDeleting(null); }
    finally { setBusy(false); }
  }
  return <><div className="page-heading"><div><span className="eyebrow">კონტენტი / კურორტები</span><h1>კურორტების მართვა<span className="heading-dot">.</span></h1><p className="muted">კურორტის ინფორმაცია, ფოტოები და სტატუსი — ორივე ენაზე.</p></div><Button label="კურორტის დამატება" icon="pi pi-plus" onClick={() => { setError(''); setNotice(''); setEditing({ id: '', slug: '', status: 'CLOSED', version: '', ka: blankContent(), en: blankContent() }); }} /></div>
    {error && <div className="feedback" role="alert"><Message severity="error" text={error} /></div>}{notice && <div className="feedback" role="status"><Message severity="success" text={notice} /></div>}
    <section className="news-panel" aria-label="კურორტების სია"><div className="list-toolbar"><span className="muted">{rows.length} კურორტი</span><div className="search-tools"><InputText aria-label="კურორტის ძებნა" value={search} onChange={e => setSearch(e.target.value)} placeholder="მოძებნეთ კურორტი…" /><Button text icon="pi pi-refresh" aria-label="კურორტების განახლება" loading={loading} onClick={() => { setError(''); void refresh(); }} /></div></div>
    <DataTable value={rows.filter(r => `${r.ka.name} ${r.en.name} ${r.slug}`.toLowerCase().includes(search.toLowerCase()))} loading={loading} dataKey="id" emptyMessage="კურორტი ვერ მოიძებნა." paginator rows={10} tableStyle={{ minWidth: '680px' }}>
      <Column header="კურორტი" body={(r: Resort) => <div className="news-title"><div className="thumb"><img src={preview(r.ka.image)} alt="" /></div><div><button onClick={() => setEditing(r)}>{r.ka.name}</button><small>/{r.slug}</small></div></div>} />
      <Column header="რეგიონი" body={(r: Resort) => r.ka.region} />
      <Column header="სტატუსი" body={(r: Resort) => <Tag value={statusOptions.find(s => s.value === r.status)?.label} severity={r.status === 'OPEN' ? 'success' : r.status === 'LIMITED' ? 'warning' : 'danger'} />} />
      <Column header="მოქმედებები" body={(r: Resort) => <div className="row-actions"><a href={`${siteUrl}/ka/resorts/${r.slug}`} target="_blank" rel="noreferrer" aria-label={`${r.ka.name} — საიტზე ნახვა`}><i className="pi pi-external-link" /></a><Button text icon="pi pi-pencil" aria-label={`${r.ka.name} — რედაქტირება`} onClick={() => setEditing(r)} /><Button text severity="danger" icon="pi pi-trash" aria-label={`${r.ka.name} — წაშლა`} onClick={() => setDeleting(r)} /></div>} />
    </DataTable><div className="panel-footer"><i className="pi pi-info-circle" /> შენახული ცვლილებები საიტის შემდეგ მოთხოვნაზე გამოჩნდება. „დახურული“ კურორტი სიაში რჩება.</div></section>
    {editing && <ResortEditor key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); setNotice('კურორტი შენახულია და საიტზე განახლებულია.'); await refresh(); }} />}
    <Dialog visible={!!deleting} onHide={() => { if (!busy) setDeleting(null); }} header="კურორტის წაშლა" modal closable={!busy} style={{ width: '480px', maxWidth: '95vw' }} footer={<><Button text label="გაუქმება" disabled={busy} onClick={() => setDeleting(null)} /><Button severity="danger" label="წაშლა" loading={busy} onClick={remove} /></>}><p>წაიშალოს „{deleting?.ka.name}“?</p><p className="muted">კურორტის გვერდი და მისი რუკის/აქტივობების გვერდები აღარ გაიხსნება. ნიუსები და სხვა განყოფილებების მასალები დარჩება.</p></Dialog>
  </>;
}

function ResortEditor({ initial, onClose, onSaved }: { initial: Resort; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [locale, setLocale] = useState<'ka' | 'en'>('ka');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const fileId = useId();
  const data = draft[locale];
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function setField<K extends keyof ResortContent>(key: K, value: ResortContent[K]) { setDraft(d => ({ ...d, [locale]: { ...d[locale], [key]: value } })); }
  function close() { if (busy || uploading) return; if (dirty) setDiscard(true); else onClose(); }
  async function upload(file: File | undefined, season: 'winter' | 'summer') {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('ფოტოს მაქსიმალური ზომაა 5 MB.'); return; }
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.set('file', file);
      const { url } = await api<{ url: string }>('/admin/media', { method: 'POST', body });
      setDraft(d => {
        const next = structuredClone(d);
        for (const lang of ['ka','en'] as const) {
          const c = next[lang];
          if (season === 'winter') { c.image = url; c.heroImages = [url]; if (!c.summerImage) c.summerImage = url; }
          else { c.summerImage = url; if (!c.image) { c.image = url; c.heroImages = [url]; } }
          c.seasons = { winter: { image: c.image, heroImages: c.heroImages.length ? c.heroImages : [c.image] }, summer: { image: c.summerImage, heroImages: season === 'summer' ? [url] : (c.seasons?.summer.heroImages || [c.summerImage]) } };
        }
        return next;
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'ატვირთვა ვერ მოხერხდა.'); }
    finally { setUploading(false); }
  }
  async function save() {
    setBusy(true); setError('');
    try { await api(initial.id ? `/admin/resorts/${initial.id}` : '/admin/resorts', { method: initial.id ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, version: draft.version || null }) }); await onSaved(); }
    catch (e) { setError(e instanceof Error ? e.message : 'შენახვა ვერ მოხერხდა.'); }
    finally { setBusy(false); }
  }
  return <><Dialog visible modal draggable={false} onHide={close} closable={!busy && !uploading} header={initial.id ? 'კურორტის რედაქტირება' : 'ახალი კურორტი'} style={{ width: '1000px', maxWidth: '97vw' }} footer={<div className="form-actions"><Button text label="გაუქმება" onClick={close} disabled={busy || uploading} /><Button label="შენახვა და საიტზე ასახვა" icon="pi pi-check" loading={busy} disabled={uploading} onClick={save} /></div>}>
    {error && <div className="editor-error" role="alert"><Message severity="error" text={error} /></div>}
    <div className="editor-grid"><section><div className="language-tabs"><button className={locale === 'ka' ? 'selected' : ''} aria-pressed={locale === 'ka'} onClick={() => setLocale('ka')}>ქართული KA</button><button className={locale === 'en' ? 'selected' : ''} aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>English EN</button></div><div className="stack">
      <label htmlFor="resort-name">კურორტის სახელი<InputText id="resort-name" maxLength={200} value={data.name} onChange={e => setField('name', e.target.value)} /></label>
      <label htmlFor="resort-region">რეგიონი<InputText id="resort-region" maxLength={200} value={data.region} onChange={e => setField('region', e.target.value)} /></label>
      <label htmlFor="resort-description">აღწერა<InputTextarea id="resort-description" rows={5} maxLength={20000} value={data.description} onChange={e => setField('description', e.target.value)} /></label>
      <details className="resort-details"><summary>მახასიათებლები და მისასვლელი გზა</summary><div className="resort-fields">{infoFields.map(([key, label]) => <label key={key} htmlFor={'resort-' + key}>{label}<InputText id={'resort-' + key} readOnly={draft.liveManaged && ['lifts','trails','temp','snow','newSnow','wind','hours'].includes(key)} maxLength={200} value={data[key]} onChange={e => setField(key, e.target.value)} /></label>)}</div><div className="stack">{([['car','მანქანით'],['transfer','ტრანსფერით'],['routeUrl','მარშრუტის ბმული (HTTPS)']] as const).map(([key,label]) => <label key={key} htmlFor={'transport-' + key}>{label}<InputText id={'transport-' + key} maxLength={2000} value={data.transport[key]} onChange={e => setField('transport', { ...data.transport, [key]: e.target.value })} /></label>)}</div></details>
      <LiveCardEditor resort={draft} locale={locale} disabled={busy || uploading} onBusy={setUploading} onChange={(settings, shared) => setDraft(d => {
        const copy = structuredClone(d);
        for (const lang of shared ? ['ka','en'] as const : [locale]) copy[lang].liveCard = { ...copy[lang].liveCard, ...settings };
        return copy;
      })} />
      <ResortPageEditor value={data.page} lifts={data.liftList} activities={data.experience.winter} disabled={busy || uploading} onBusy={setUploading} onChange={page => setField('page', page)} />
      <p className="translation-note">შეავსეთ ორივე ენა. არსებული დეტალური სიები, გალერეა და აქტივობები შენახვისას შენარჩუნდება.</p>
    </div></section><aside className="editor-settings"><div className="stack"><label htmlFor="resort-slug">ბმულის დაბოლოება<InputText id="resort-slug" disabled={!!initial.id} value={draft.slug} maxLength={150} onChange={e => setDraft({ ...draft, slug: e.target.value.toLowerCase() })} placeholder="new-resort" /><small>შენახვის შემდეგ უცვლელია.</small></label><label htmlFor="resort-status">სტატუსი<Dropdown disabled={draft.liveManaged} inputId="resort-status" options={statusOptions} value={draft.status} onChange={e => setDraft({ ...draft, status: e.value })} /></label>
      {(['winter','summer'] as const).map(season => <div className="field-label" key={season}>{season === 'winter' ? 'ზამთრის ფოტო' : 'ზაფხულის ფოტო'}<div className="cover-preview">{(season === 'winter' ? data.image : data.summerImage) ? <img src={preview(season === 'winter' ? data.image : data.summerImage)} alt={season === 'winter' ? 'ზამთრის ფოტო' : 'ზაფხულის ფოტო'} /> : <div><i className="pi pi-image" /></div>}</div><label className="upload-button" htmlFor={fileId + season}><i className={uploading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'} /> ფოტოს ატვირთვა</label><input className="file-input" id={fileId + season} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} onChange={e => { void upload(e.target.files?.[0], season); e.target.value = ''; }} /></div>)}
    </div></aside></div>
  </Dialog><Dialog visible={discard} onHide={() => setDiscard(false)} header="შეუნახავი ცვლილებები" modal style={{ width: '440px', maxWidth: '95vw' }} footer={<><Button text label="გაგრძელება" onClick={() => setDiscard(false)} /><Button severity="danger" label="გაუქმება" onClick={onClose} /></>}><p>დახურვისას შეუნახავი ცვლილებები დაიკარგება.</p></Dialog></>;
}
function LiveCardEditor({ resort, locale, disabled, onBusy, onChange }: { resort: Resort; locale: 'ka' | 'en'; disabled: boolean; onBusy: (busy: boolean) => void; onChange: (settings: Partial<LiveCardSettings>, shared: boolean) => void }) {
  const settings = resort[locale].liveCard || {};
  const id = useId();
  const [error, setError] = useState('');
  const [conditions, setConditions] = useState<Conditions | null>(null);
  useEffect(() => {
    let active = true;
    api<Conditions[]>('/resorts/conditions').then(rows => { if (active) setConditions(rows.find(row => row.resortId === resort.id) || null); }).catch(() => { if (active) setConditions(null); });
    return () => { active = false; };
  }, [resort.id]);
  async function uploadCard(file: File | undefined, season: 'winter' | 'summer') {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('მაქსიმალური ზომაა 5 MB.'); return; }
    setError(''); onBusy(true);
    try {
      const body = new FormData(); body.set('file', file);
      const { url } = await api<{url:string}>('/admin/media', { method: 'POST', body });
      onChange({ [season === 'winter' ? 'winterImage' : 'summerImage']: url }, true);
    } catch (e) { setError(e instanceof Error ? e.message : 'ატვირთვა ვერ მოხერხდა.'); }
    finally { onBusy(false); }
  }
  return <fieldset disabled={disabled} className="live-card-editor"><legend>მთავარი გვერდის მთის ბარათი / Homepage card</legend>
    {error && <p role="alert">{error}</p>}
    <div className="resort-fields">
      {(['winter','summer'] as const).map(season => {
        const key = season === 'winter' ? 'winterImage' : 'summerImage';
        const path = settings[key] || (season === 'winter' ? resort[locale].image : resort[locale].summerImage);
        return <div className="field-label" key={season}>{season === 'winter' ? 'ზამთრის ბარათი / Winter' : 'ზაფხულის ბარათი / Summer'}
          <div className="cover-preview">{path && <img src={preview(path)} alt={settings.imageAlt || resort[locale].name} />}</div>
          <input aria-label={season + ' card image'} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void uploadCard(e.target.files?.[0], season); e.target.value = ''; }} />
          {settings[key] && <Button type="button" text label="კურორტის ფოტოს გამოყენება / Reset" onClick={() => onChange({ [key]: '' }, true)} />}
        </div>;
      })}
    </div>
    <div className="stack">
      <label htmlFor={id+'alt'}>ფოტოს აღწერა / Image alt ({locale.toUpperCase()})<InputText id={id+'alt'} value={settings.imageAlt || ''} maxLength={400} onChange={e => onChange({ imageAlt: e.target.value }, false)} /></label>
      <label htmlFor={id+'note'}>შენიშვნა / Note ({locale.toUpperCase()})<InputTextarea id={id+'note'} rows={3} maxLength={400} value={settings.note || ''} onChange={e => onChange({ note: e.target.value }, false)} /></label>
      <label><input type="checkbox" checked={settings.featured === true} onChange={e => onChange({ featured: e.target.checked }, true)} />გამორჩეული / Featured</label>
      <label><input type="checkbox" checked={settings.homepageVisible !== false} onChange={e => onChange({ homepageVisible: e.target.checked }, true)} />მთავარ გვერდზე გამოჩენა / Show on homepage</label>
      <label htmlFor={id+'order'}>რიგითობა / Order<InputText id={id+'order'} type="number" min={0} max={999} value={String(settings.displayOrder ?? 100)} onChange={e => onChange({ displayOrder: Math.min(999, Math.max(0, Number(e.target.value) || 0)) }, true)} /></label>
    </div>
    <p className="translation-note">მიმდინარე მონაცემები — ავტომატური მართვა / Live data – managed automatically</p>
    <dl className="live-admin-observations">{(['status','temperature','weatherCondition','snowDepthCm','newSnow24hCm','liftsOpen','liftsTotal','trailsOpen','trailsTotal','windSpeedKmh','windDirection','visibility','operatingFrom','operatingTo','topElevationM','lastUpdatedAt'] as const).map(key => <div key={key}><dt>{conditionLabels[key]}</dt><dd>{conditions?.[key] ?? '—'}</dd></div>)}</dl>
  </fieldset>;
}
