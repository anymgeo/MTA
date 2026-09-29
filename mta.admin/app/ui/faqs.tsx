'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { api } from './api';

type Faq = {
  id?: string; version?: string; scope: string; sortOrder: number; published: boolean;
  categoryKa: string; categoryEn: string;
  questionKa: string; questionEn: string; answerKa: string; answerEn: string;
};
type ResortOption = { slug: string };
const blank = (): Faq => ({ scope: '', sortOrder: 0, published: false,
  categoryKa: '', categoryEn: '', questionKa: '', questionEn: '', answerKa: '', answerEn: '' });

export default function Faqs() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [resorts, setResorts] = useState<ResortOption[]>([]);
  const [scope, setScope] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Faq | null>(null);
  const [original, setOriginal] = useState('');
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'შეცდომა / Error');
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [faqs, options] = await Promise.all([api<Faq[]>('/admin/faqs'), api<ResortOption[]>('/admin/resorts')]);
      setRows(faqs); setResorts(options);
    } catch (e) { fail(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const task = window.setTimeout(() => { void refresh(); }, 0); return () => window.clearTimeout(task); }, [refresh]);
  function edit(row: Faq) { setOriginal(JSON.stringify(row)); setEditing({ ...row }); setError(''); setNotice(''); }
  function close() {
    if (!busy && (JSON.stringify(editing) === original || window.confirm('ცვლილებების გაუქმება? / Discard changes?'))) setEditing(null);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!editing) return;
    setBusy(true); setError('');
    try {
      await api('/admin/faqs' + (editing.id ? '/' + editing.id : ''), {
        method: editing.id ? 'PUT' : 'POST', body: JSON.stringify(editing),
      });
      setEditing(null); setNotice('FAQ შენახულია / FAQ saved'); await refresh();
    } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true); setError('');
    try {
      await api('/admin/faqs/' + deleting.id + '?version=' + deleting.version, { method: 'DELETE' });
      setDeleting(null); setNotice('FAQ წაიშალა / FAQ deleted'); await refresh();
    } catch (e) { fail(e); } finally { setBusy(false); }
  }
  const filtered = rows.filter(row => (scope === 'all' || row.scope === scope) &&
    [row.questionKa, row.questionEn, row.answerKa, row.answerEn].join(' ').toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading"><div><h1>FAQ</h1><p className="muted">კითხვები და პასუხები / Questions and answers</p></div>
      <Button label="დამატება / Add FAQ" icon="pi pi-plus" onClick={() => edit({ ...blank(), scope: scope === 'all' ? '' : scope })} /></div>
    {!editing && !deleting && error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <section className="news-panel">
      <div className="list-toolbar">
        <label>გვერდი / Page <select value={scope} onChange={e => setScope(e.target.value)}>
          <option value="all">ყველა / All</option><option value="">FAQ — მთავარი / Main</option>
          {resorts.map(r => <option key={r.slug} value={r.slug}>{r.slug}</option>)}
        </select></label>
        <InputText aria-label="FAQ ძებნა / Search" placeholder="ძებნა / Search" value={search} onChange={e => setSearch(e.target.value)} />
        <Button text icon="pi pi-refresh" aria-label="განახლება / Refresh" loading={loading} onClick={() => { setError(''); void refresh(); }} />
      </div>
      <DataTable value={filtered} loading={loading} dataKey="id" paginator rows={10} emptyMessage="FAQ არ მოიძებნა / No FAQs found" tableStyle={{ minWidth: '680px' }}>
        <Column field="sortOrder" header="რიგი / Order" />
        <Column header="კითხვა / Question" body={(row: Faq) => <div><strong>{row.questionKa}</strong><p className="muted">{row.questionEn}</p></div>} />
        <Column header="გვერდი / Page" body={(row: Faq) => row.scope || 'FAQ'} />
        <Column header="სტატუსი / Status" body={(row: Faq) => <Tag severity={row.published ? 'success' : 'warning'} value={row.published ? 'Published' : 'Draft'} />} />
        <Column header="მოქმედებები / Actions" body={(row: Faq) => <div className="row-actions">
          <Button text icon="pi pi-pencil" aria-label={'Edit ' + row.questionEn} onClick={() => edit(row)} />
          <Button text severity="danger" icon="pi pi-trash" aria-label={'Delete ' + row.questionEn} onClick={() => { setError(''); setDeleting(row); }} />
        </div>} />
      </DataTable>
      <p className="panel-footer">დაბალი რიგის ნომერი ჩანს პირველი. მხოლოდ გამოქვეყნებული კითხვებია ხილული. / Lower order appears first; only published FAQs are visible.</p>
    </section>
    <Dialog visible={!!editing} onHide={close} header="FAQ — რედაქტირება / Edit" modal closable={!busy} style={{ width: '760px', maxWidth: '95vw' }}>
      {editing && <form className="stack" onSubmit={save}>
        {error && <p role="alert">{error}</p>}
        <fieldset disabled={busy} className="stack" style={{ border: 0, padding: 0 }}>
          <label>გვერდი / Page<select value={editing.scope} onChange={e => setEditing({ ...editing, scope: e.target.value })}>
            <option value="">FAQ — მთავარი / Main</option>{resorts.map(r => <option key={r.slug} value={r.slug}>{r.slug}</option>)}
          </select></label>
          <label>რიგი / Display order<InputText type="number" required min={0} max={1000000} step={1} value={String(editing.sortOrder)} onChange={e => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></label>
          {(['Ka', 'En'] as const).map(lang => <section className="stack" key={lang}>
            <h3>{lang === 'Ka' ? 'ქართული' : 'English'}</h3>
            <label>კატეგორია / Category (optional)<InputText maxLength={100} value={editing[`category${lang}`]} onChange={e => setEditing({ ...editing, [`category${lang}`]: e.target.value })} /></label>
            <label>კითხვა / Question<InputText required maxLength={500} value={editing[`question${lang}`]} onChange={e => setEditing({ ...editing, [`question${lang}`]: e.target.value })} /></label>
            <label>პასუხი / Answer<InputTextarea required rows={5} maxLength={10000} value={editing[`answer${lang}`]} onChange={e => setEditing({ ...editing, [`answer${lang}`]: e.target.value })} /></label>
          </section>)}
          <label><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /> გამოქვეყნებული / Published</label>
        </fieldset>
        <div className="row-actions"><Button type="button" text label="გაუქმება / Cancel" disabled={busy} onClick={close} /><Button type="submit" label="შენახვა / Save" loading={busy} /></div>
      </form>}
    </Dialog>
    <Dialog visible={!!deleting} onHide={() => { if (!busy) setDeleting(null); }} header="FAQ წაშლა / Delete FAQ" modal closable={!busy} style={{ width: '480px', maxWidth: '95vw' }}>
      {error && <p role="alert">{error}</p>}
      <p>{deleting?.questionKa}</p><p>წაშლა შეუქცევადია. / This cannot be undone.</p>
      <Button text label="გაუქმება / Cancel" disabled={busy} onClick={() => setDeleting(null)} />
      <Button severity="danger" label="წაშლა / Delete" loading={busy} onClick={remove} />
    </Dialog>
  </>;
}
