'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { api, type PortalUser, type Session } from './api';

const roles = [
  { label: 'Super Admin — სრული წვდომა', value: 'WebPortalAdmin' },
  { label: 'Moderator — მომხმარებლების დამატების/წაშლის გარეშე', value: 'WebPortalModerator' },
];
type UserDraft = PortalUser & { password: string; currentPassword: string };
const blank = (): UserDraft => ({ id: '', email: '', displayName: '', role: 'WebPortalModerator', version: '', password: '', currentPassword: '' });

export default function Users({ session, onSessionChanged }: { session: Session; onSessionChanged: (session: Session) => void }) {
  const [rows, setRows] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [deleting, setDeleting] = useState<PortalUser | null>(null);
  const [discard, setDiscard] = useState(false);
  const [initialDraft, setInitialDraft] = useState('');
  const isSuper = session.role === 'WebPortalAdmin';
  const dirty = !!draft && JSON.stringify(draft) !== initialDraft;
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setRows(await api<PortalUser[]>('/admin/users')); }
    catch (e) { setError(e instanceof Error ? e.message : 'სია ვერ ჩაიტვირთა.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    api<PortalUser[]>('/admin/users').then(data => { if (active) setRows(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'სია ვერ ჩაიტვირთა.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function edit(user?: PortalUser) {
    const data = user ? { ...user, password: '', currentPassword: '' } : blank();
    setError(''); setNotice(''); setDraft(data); setInitialDraft(JSON.stringify(data));
  }
  function close() { if (busy) return; if (dirty) setDiscard(true); else setDraft(null); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!draft) return;
    setBusy(true); setError('');
    try {
      await api(draft.id ? `/admin/users/${draft.id}` : '/admin/users', { method: draft.id ? 'PUT' : 'POST', body: JSON.stringify(draft) });
      setDraft(null); setNotice('მომხმარებელი შენახულია.');
      onSessionChanged(await api<Session>('/admin/session'));
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'შენახვა ვერ მოხერხდა.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return; setBusy(true); setError('');
    try {
      await api(`/admin/users/${deleting.id}?version=${encodeURIComponent(deleting.version)}`, { method: 'DELETE' });
      setDeleting(null); setNotice('მომხმარებელი წაიშალა.');
      const current = await api<Session>('/admin/session'); onSessionChanged(current);
      if (current.authenticated) await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'წაშლა ვერ მოხერხდა.'); setDeleting(null); }
    finally { setBusy(false); }
  }
  const filtered = rows.filter(user => `${user.email} ${user.displayName}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading"><div><span className="eyebrow">ადმინისტრირება / გუნდი</span><h1>მომხმარებლები<span className="heading-dot">.</span></h1><p className="muted">გუნდის ანგარიშები და მართვის უფლებები.</p></div>{isSuper && <Button label="მომხმარებლის დამატება" icon="pi pi-user-plus" onClick={() => edit()} />}</div>
    {error && !draft && <div className="feedback" role="alert"><Message severity="error" text={error} /></div>}
    {notice && <div className="feedback" role="status"><Message severity="success" text={notice} /></div>}
    <section className="news-panel" aria-label="მომხმარებლების სია"><div className="list-toolbar"><span className="muted">{rows.length} ანგარიში</span><div className="search-tools"><InputText aria-label="მომხმარებლის ძებნა" placeholder="სახელი ან ელფოსტა…" value={search} onChange={e => setSearch(e.target.value)} /><Button text icon="pi pi-refresh" aria-label="მომხმარებლების განახლება" loading={loading} onClick={() => { setError(''); void refresh(); }} /></div></div>
    <DataTable value={filtered} loading={loading} dataKey="id" paginator rows={10} tableStyle={{ minWidth: '620px' }} emptyMessage="მომხმარებელი ვერ მოიძებნა.">
      <Column header="სახელი" body={(user: PortalUser) => <div className="user-name"><span className="avatar">{(user.displayName || user.email).slice(0,1).toUpperCase()}</span><b>{user.displayName || 'ადმინისტრატორი'}</b>{user.id === session.id && <small>თქვენ</small>}</div>} />
      <Column field="email" header="ელფოსტა" />
      <Column header="როლი" body={(user: PortalUser) => <Tag value={user.role === 'WebPortalAdmin' ? 'Super Admin' : 'Moderator'} severity={user.role === 'WebPortalAdmin' ? 'success' : 'info'} />} />
      <Column header="მოქმედებები" body={(user: PortalUser) => <div className="row-actions"><Button text icon="pi pi-pencil" aria-label={`${user.email} — რედაქტირება`} onClick={() => edit(user)} />{isSuper && <Button text severity="danger" icon="pi pi-trash" aria-label={`${user.email} — წაშლა`} onClick={() => { setError(''); setDeleting(user); }} />}</div>} />
    </DataTable><div className="panel-footer"><i className="pi pi-shield" /> {isSuper ? 'თქვენ გაქვთ სრული წვდომა მომხმარებლებისა და კონტენტის მართვაზე.' : 'შეგიძლიათ მომხმარებლების რედაქტირება და კონტენტის სრული მართვა. დამატება და წაშლა Super Admin-ს ეკუთვნის.'}</div></section>
    <Dialog visible={!!draft} onHide={close} header={draft?.id ? 'მომხმარებლის რედაქტირება' : 'ახალი მომხმარებელი'} modal style={{ width: '570px', maxWidth: '96vw' }} closable={!busy} draggable={false}>
      {draft && <form className="stack" onSubmit={save}>
        {error && <div role="alert"><Message severity="error" text={error} /></div>}
        <label htmlFor="user-name">სახელი და გვარი<InputText id="user-name" autoFocus required maxLength={120} value={draft.displayName} onChange={e => setDraft({ ...draft, displayName: e.target.value })} /></label>
        <label htmlFor="user-email">ელფოსტა<InputText id="user-email" type="email" autoComplete="off" required maxLength={254} value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /><small>ელფოსტა გამოიყენება სისტემაში შესასვლელად.</small></label>
        <label htmlFor="user-role">როლი<Dropdown inputId="user-role" options={roles} value={draft.role} disabled={!isSuper} onChange={e => setDraft({ ...draft, role: e.value })} /><small>{isSuper ? 'როლის შეცვლა დაუყოვნებლივ განაახლებს წვდომებს.' : 'როლის მინიჭება მხოლოდ Super Admin-ს შეუძლია.'}</small></label>
        {(isSuper || draft.id === session.id) && <label htmlFor="user-new-password">{draft.id ? 'ახალი პაროლი (არასავალდებულო)' : 'პაროლი'}<InputText id="user-new-password" type="password" autoComplete="new-password" minLength={12} maxLength={256} required={!draft.id} value={draft.password} onChange={e => setDraft({ ...draft, password: e.target.value })} /><small>მინიმუმ 12 სიმბოლო: დიდი/პატარა ასო, ციფრი და სპეციალური სიმბოლო.</small></label>}
        {!isSuper && draft.id === session.id && draft.password && <label htmlFor="user-current-password">მიმდინარე პაროლი<InputText id="user-current-password" type="password" autoComplete="current-password" required value={draft.currentPassword} onChange={e => setDraft({ ...draft, currentPassword: e.target.value })} /></label>}
        <div className="form-actions"><Button type="button" label="გაუქმება" text disabled={busy} onClick={close} /><Button type="submit" label="შენახვა" icon="pi pi-check" loading={busy} /></div>
      </form>}
    </Dialog>
    <Dialog visible={!!deleting} onHide={() => { if (!busy) setDeleting(null); }} header="მომხმარებლის წაშლა" modal closable={!busy} style={{ width: '460px', maxWidth: '95vw' }} footer={<><Button text label="გაუქმება" disabled={busy} onClick={() => setDeleting(null)} /><Button label="წაშლა" severity="danger" loading={busy} onClick={remove} /></>}><p>წაიშალოს {deleting?.email}?</p><p className="muted">მისი სესიები გაუქმდება. გამოქვეყნებული კონტენტი დარჩება.</p></Dialog>
    <Dialog visible={discard} onHide={() => setDiscard(false)} header="შეუნახავი ცვლილებები" modal style={{ width: '440px', maxWidth: '95vw' }} footer={<><Button text label="გაგრძელება" onClick={() => setDiscard(false)} /><Button severity="danger" label="ცვლილებების გაუქმება" onClick={() => { setDraft(null); setDiscard(false); }} /></>}><p>დახურვისას შეუნახავი ცვლილებები დაიკარგება.</p></Dialog>
  </>;
}
