'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { api, ApiError, blankNews, type News, type Session } from './api';
import Editor from './editor';
import Users from './users';
import Resorts from './resorts';
import Faqs from './faqs';
import { BrandLogo, MountainBadge } from './brand';

export default function Admin({ siteUrl, initialSection = 'news' }: { siteUrl: string; initialSection?: 'news' | 'resorts' }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<News | null>(null);
  const [deleting, setDeleting] = useState<News | null>(null);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<'news' | 'users' | 'resorts' | 'faqs'>(initialSection);
  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : 'დაფიქსირდა შეცდომა.');
    if (e instanceof ApiError && e.status === 401) setSession(null);
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setRows(await api<News[]>('/admin/news')); }
    catch (e) { fail(e); }
    finally { setLoading(false); }
  }, [fail]);
  useEffect(() => {
    let active = true;
    api<Session>('/admin/session').then(async s => {
      if (!active) return;
      setSession(s);
      if (s.authenticated) await refresh();
    }).catch(e => { if (active) fail(e); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [refresh, fail]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api('/admin/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      setSession(await api<Session>('/admin/session')); setSection('news'); await refresh();
    } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function logout() {
    try { await api('/admin/logout', { method: 'POST' }); setSession(null); setRows([]); setEditing(null); setNotice(''); }
    catch (e) { fail(e); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true); setError('');
    try {
      await api(`/admin/news/${deleting.id}?version=${deleting.version}`, { method: 'DELETE' });
      setDeleting(null); setNotice('ნიუსი წაიშალა. საიტზე ის აღარ გამოჩნდება.'); await refresh();
    } catch (e) { fail(e); setDeleting(null); } finally { setBusy(false); }
  }
  if (checking) return <div className="splash" role="status"><BrandLogo priority /><p>მართვის პანელი იტვირთება…</p></div>;
  if (!session?.authenticated) return <main className="login-page">
    <section className="login-story">
      <Image className="login-hero-image" src="/brand/goderdzi-login.webp" alt="გოდერძის თოვლიანი სამთო კურორტი" fill priority sizes="(max-width: 760px) 100vw, 63vw" />
      <div className="login-visual-head"><a href={siteUrl} aria-label="M.T.A. საიტზე გადასვლა"><BrandLogo priority /></a><div className="admin-lockup"><MountainBadge /><div><span>MTA WORKSPACE</span><strong>Admin Panel</strong></div></div></div>
      <div className="login-copy"><span className="eyebrow">MOUNTAIN TRAILS AGENCY</span><h1>მთის ამბები<br />MTA . SKI</h1><p>კონტენტის მართვის სისტემა (CMS)<br />MTA.SKI - სთვის</p></div>
      <span className="login-foot">გუდაური · ბაკურიანი · მესტია · გოდერძი</span>
    </section>
    <section className="login-form"><div><span className="eyebrow">ადმინისტრირება</span><h2>კეთილი იყოს<br />თქვენი დაბრუნება</h2><p className="muted">გაიარეთ ავტორიზაცია თქვენი პირადი მონაცემებით</p>
      <form onSubmit={login} className="stack">{error && <Message severity="error" text={error} />}
        <label htmlFor="email">ელფოსტა<InputText id="email" name="email" type="email" autoComplete="username" required autoFocus /></label>
        <label htmlFor="password">პაროლი<InputText id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
        <Button label="შესვლა" icon="pi pi-arrow-right" iconPos="right" loading={busy} type="submit" />
      </form><p className="login-note"><i className="pi pi-lock" /> მხოლოდ ავტორიზებული თანამშრომლებისთვის</p></div></section>
  </main>;
  const filtered = rows.filter(n => (filter === 'all' || n.published === (filter === 'published')) && `${n.titleKa} ${n.titleEn} ${n.slug}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="workspace">
    <aside className="sidebar"><Link className="brand" href="/" aria-label="MTA Admin Panel"><BrandLogo priority /></Link><span className="nav-label">სამუშაო სივრცე</span><button className={`nav-item ${section === 'news' ? 'active' : ''}`} onClick={() => { setSection('news'); setSearch(''); setFilter('all'); }}><i className="pi pi-file-edit" />სიახლეები<span>{rows.length}</span></button><button className={`nav-item ${section === 'users' ? 'active' : ''}`} onClick={() => setSection('users')}><i className="pi pi-users" />მომხმარებლები</button><button className={`nav-item ${section === 'resorts' ? 'active' : ''}`} onClick={() => setSection('resorts')}><i className="pi pi-map" />კურორტები</button><button className={`nav-item ${section === 'faqs' ? 'active' : ''}`} onClick={() => setSection('faqs')}><i className="pi pi-question-circle" />FAQ</button><div className="sidebar-bottom"><a href={siteUrl} target="_blank" rel="noreferrer"><i className="pi pi-external-link" /> საიტის ნახვა</a><div className="account"><span className="avatar">A</span><div><b>{session.role === 'WebPortalAdmin' ? 'Super Admin' : 'Moderator'}</b><small>{session.email}</small></div><button onClick={logout} aria-label="გასვლა" title="გასვლა"><i className="pi pi-sign-out" /></button></div></div></aside>
    <div className="workspace-main"><header className="topbar"><div className="topbar-brand"><MountainBadge /><span><small>M.T.A.</small><strong>Admin Panel</strong></span></div><span className="topbar-path">კონტენტის მართვა <i className="pi pi-angle-right" /> <b>{section === 'faqs' ? 'FAQ' : section === 'news' ? 'სიახლეები' : section === 'resorts' ? 'კურორტები' : 'მომხმარებლები'}</b></span><span className="private-label"><i className="pi pi-lock" /> პირადი სივრცე</span></header>
      <main className="main-content">{section === 'faqs' ? <Faqs /> : section === 'users' ? <Users session={session} onSessionChanged={setSession} /> : section === 'resorts' ? <Resorts siteUrl={siteUrl} session={session} /> : <><div className="page-heading"><div><span className="eyebrow">კონტენტი / სიახლეები</span><h1>მთის სიახლეები<span className="heading-dot">.</span></h1><p className="muted">შექმენით ამბავი, შეინახეთ მონახაზი და გამოაქვეყნეთ საიტზე.</p></div><Button label="ნიუსის დამატება" icon="pi pi-plus" onClick={() => { setEditing(blankNews()); setError(''); setNotice(''); }} /></div>
      {error && <div className="feedback" role="alert"><Message severity="error" text={error} /><Button text label="დახურვა" onClick={() => setError('')} /></div>}
      {notice && <div className="feedback" role="status"><Message severity="success" text={notice} /><Button text label="დახურვა" onClick={() => setNotice('')} /></div>}
      <section className="news-panel" aria-label="ნიუსების სია"><div className="list-toolbar"><div className="filters" aria-label="სტატუსის ფილტრი">{[['all','ყველა'], ['published','გამოქვეყნებული'], ['draft','მონახაზი']].map(([value,label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="search-tools"><span className="search-box"><i className="pi pi-search" /><InputText aria-label="ნიუსის ძებნა" placeholder="მოძებნეთ ნიუსი…" value={search} onChange={e => setSearch(e.target.value)} /></span><Button text icon="pi pi-refresh" aria-label="სიის განახლება" loading={loading} onClick={() => { setError(''); void refresh(); }} /></div></div>
        <DataTable value={filtered} loading={loading} dataKey="id" paginator rows={8} emptyMessage={<div className="empty"><i className="pi pi-file-edit" /><h3>{search || filter !== 'all' ? 'ნიუსი ვერ მოიძებნა' : 'პირველი ამბის დროა'}</h3><p>{search || filter !== 'all' ? 'შეცვალეთ ძებნა ან სტატუსის ფილტრი.' : 'დააჭირეთ „ნიუსის დამატებას“ და შექმენით პირველი სიახლე.'}</p></div>} tableStyle={{ minWidth: '740px' }}>
          <Column header="ნიუსი" body={(n: News) => <div className="news-title"><div className="thumb">{n.image ? <img src={n.image} alt="" /> : <i className="pi pi-image" />}</div><div><button onClick={() => setEditing(n)}>{n.titleKa}</button><small>/{n.slug}</small></div></div>} />
          <Column header="კატეგორია" body={(n: News) => <Tag value={n.category === 'article' ? 'სტატია' : n.category === 'blog' ? 'ბლოგი' : 'სიახლე'} />} />
          <Column header="სტატუსი" body={(n: News) => <Tag value={n.published ? 'გამოქვეყნებული' : 'მონახაზი'} severity={n.published ? 'success' : 'warning'} />} />
          <Column header="თარიღი" body={(n: News) => <span className="date-cell">{n.date.split('-').reverse().join('.')}</span>} />
          <Column header="მოქმედებები" body={(n: News) => <div className="row-actions">{n.published && <a href={`${siteUrl}/ka/news/${n.slug}`} target="_blank" rel="noreferrer" aria-label={`${n.titleKa} — საიტზე ნახვა`} title="საიტზე ნახვა"><i className="pi pi-external-link" /></a>}<Button text icon="pi pi-pencil" aria-label={`${n.titleKa} — რედაქტირება`} tooltip="რედაქტირება" onClick={() => setEditing(n)} /><Button text severity="danger" icon="pi pi-trash" aria-label={`${n.titleKa} — წაშლა`} tooltip="წაშლა" onClick={() => setDeleting(n)} /></div>} />
        </DataTable><div className="panel-footer"><i className="pi pi-info-circle" /> საიტზე მხოლოდ გამოქვეყნებული ნიუსები ჩანს. ცვლილებები გვერდის განახლებისას აისახება.</div>
      </section></>}<footer className="workspace-footer"><span>MTA · კონტენტის მართვა</span><span>საქართველოს მთის კურორტები</span></footer></main></div>
      {editing && <Editor key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} onSaved={async n => { setEditing(null); setNotice(n.published ? 'ნიუსი შენახულია და საიტზე გამოქვეყნებულია.' : 'მონახაზი შენახულია. საიტზე ის ჯერ არ ჩანს.'); await refresh(); }} />}
      <Dialog visible={!!deleting} onHide={() => { if (!busy) setDeleting(null); }} header="ნიუსის წაშლა" style={{ width: '460px', maxWidth: '95vw' }} modal closable={!busy} footer={<><Button label="გაუქმება" text disabled={busy} onClick={() => setDeleting(null)} /><Button label="წაშლა" severity="danger" icon="pi pi-trash" loading={busy} onClick={remove} /></>}><p>ნამდვილად გსურთ „{deleting?.titleKa}“-ს წაშლა?</p><p className="muted">ნიუსი საიტიდანაც გაქრება. ამ მოქმედების დაბრუნება შეუძლებელია.</p></Dialog>
    </div>;
}
