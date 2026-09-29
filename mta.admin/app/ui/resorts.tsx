'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { api, type Session } from './api';
import { preview, statusOptions, type Resort } from './resort-model';

export default function Resorts({ siteUrl, session }: { siteUrl: string; session: Session }) {
  const router = useRouter();
  const [rows, setRows] = useState<Resort[]>([]), [loading, setLoading] = useState(true), [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<Resort | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const refresh = useCallback(async () => { setLoading(true); try { setRows(await api<Resort[]>('/admin/resorts')); } catch (e) { setError(e instanceof Error ? e.message : 'კურორტები ვერ ჩაიტვირთა.'); } finally { setLoading(false); } }, []);
  useEffect(() => { let active=true;api<Resort[]>('/admin/resorts').then(data=>{if(active)setRows(data);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'კურორტები ვერ ჩაიტვირთა.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;}; }, []);
  async function remove() {
    if (!deleting) return; setBusy(true); setError('');
    try { await api(`/admin/resorts/${deleting.id}?version=${deleting.version}`, { method: 'DELETE' }); setDeleting(null); setNotice('კურორტი წაიშალა და საიტის სიიდან მოიხსნა.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'წაშლა ვერ მოხერხდა.'); setDeleting(null); }
    finally { setBusy(false); }
  }
  const filtered = rows.filter(r => `${r.ka.name} ${r.en.name} ${r.slug}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading"><div><span className="eyebrow">კონტენტი / კურორტები</span><h1>კურორტების მართვა<span className="heading-dot">.</span></h1><p className="muted">ბრენდი, კონტენტი, ინფრასტრუქტურა და ინტერაქტიული რუკები ერთ სივრცეში.</p></div><Button label="კურორტის დამატება" icon="pi pi-plus" onClick={() => router.push('/resorts/new')} /></div>
    {error && <div className="feedback" role="alert"><Message severity="error" text={error} /><Button text label="დახურვა" onClick={() => setError('')} /></div>}
    {notice && <div className="feedback" role="status"><Message severity="success" text={notice} /><Button text label="დახურვა" onClick={() => setNotice('')} /></div>}
    <section className="news-panel" aria-label="კურორტების სია"><div className="list-toolbar"><span className="muted">{rows.length} კურორტი</span><div className="search-tools"><span className="search-box"><i className="pi pi-search" /><InputText aria-label="კურორტის ძებნა" value={search} onChange={e => setSearch(e.target.value)} placeholder="მოძებნეთ კურორტი…" /></span><Button text icon="pi pi-refresh" aria-label="კურორტების განახლება" loading={loading} onClick={() => { setError(''); void refresh(); }} /></div></div>
      <DataTable value={filtered} loading={loading} dataKey="id" emptyMessage={<div className="empty"><i className="pi pi-map" /><h3>{search ? 'კურორტი ვერ მოიძებნა' : 'დაამატეთ პირველი კურორტი'}</h3><p>{search ? 'შეცვალეთ საძიებო ტექსტი.' : 'კურორტის სრული სამუშაო სივრცის გასახსნელად დააჭირეთ დამატებას.'}</p></div>} paginator rows={10} tableStyle={{ minWidth: '680px' }}>
        <Column header="კურორტი" body={(r: Resort) => <div className="news-title"><div className="thumb"><img src={preview(r.ka.image)} alt="" /></div><div><button onClick={() => router.push(`/resorts/${r.id}/edit`)}>{r.ka.name}</button><small>/{r.slug}</small></div></div>} />
        <Column header="რეგიონი" body={(r: Resort) => r.ka.region} />
        <Column header="სტატუსი" body={(r: Resort) => <Tag value={statusOptions.find(s => s.value === r.status)?.label} severity={r.status === 'OPEN' ? 'success' : r.status === 'LIMITED' ? 'warning' : 'danger'} />} />
        <Column header="მოქმედებები" body={(r: Resort) => <div className="row-actions"><a href={`${siteUrl}/ka/resorts/${r.slug}`} target="_blank" rel="noreferrer" aria-label={`${r.ka.name} — საიტზე ნახვა`}><i className="pi pi-external-link" /></a><Button text icon="pi pi-pencil" aria-label={`${r.ka.name} — რედაქტირება`} onClick={() => router.push(`/resorts/${r.id}/edit`)} />{session.role === 'WebPortalAdmin' && <Button text severity="danger" icon="pi pi-trash" aria-label={`${r.ka.name} — წაშლა`} onClick={() => setDeleting(r)} />}</div>} />
      </DataTable><div className="panel-footer"><i className="pi pi-info-circle" /> რედაქტირება იხსნება ცალკე სრულ გვერდზე. ცვლილებები ერთიანად ინახება.</div>
    </section>
    <Dialog visible={!!deleting} onHide={() => { if (!busy) setDeleting(null); }} header="კურორტის წაშლა" modal closable={!busy} style={{ width: '480px', maxWidth: '95vw' }} footer={<><Button text label="გაუქმება" disabled={busy} onClick={() => setDeleting(null)} /><Button severity="danger" label="წაშლა" loading={busy} onClick={remove} /></>}><p>წაიშალოს „{deleting?.ka.name}“?</p><p className="muted">კურორტის გვერდი და რუკა საიტიდან მოიხსნება. ამ მოქმედების დაბრუნება შეუძლებელია.</p></Dialog>
  </>;
}
