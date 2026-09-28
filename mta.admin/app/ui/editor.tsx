'use client';
import { useEffect, useId, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { api, type News } from './api';

export default function Editor({ initial, onClose, onSaved }: { initial: News; onClose: () => void; onSaved: (n: News) => Promise<void> }) {
  const [draft, setDraft] = useState<News>(() => structuredClone(initial));
  const [kaText, setKaText] = useState(initial.contentKa.join('\n\n'));
  const [enText, setEnText] = useState(initial.contentEn.join('\n\n'));
  const [locale, setLocale] = useState<'ka' | 'en'>('ka');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const uploadId = useId();
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || kaText !== initial.contentKa.join('\n\n') || enText !== initial.contentEn.join('\n\n');
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function set<K extends keyof News>(key: K, value: News[K]) { setDraft(n => ({ ...n, [key]: value })); }
  function close() { if (busy || uploading) return; if (dirty) setDiscard(true); else onClose(); }
  async function upload(file: File | undefined, gallery: boolean) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('ფოტოს მაქსიმალური ზომაა 5 MB.'); return; }
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.set('file', file);
      const result = await api<{ url: string }>('/admin/media', { method: 'POST', body });
      setDraft(n => gallery ? { ...n, gallery: [...n.gallery, result.url] } : { ...n, image: result.url });
    } catch (e) { setError(e instanceof Error ? e.message : 'ატვირთვა ვერ მოხერხდა.'); }
    finally { setUploading(false); }
  }
  async function save(published: boolean) {
    setBusy(true); setError('');
    const paragraphs = (s: string) => s.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const payload = { ...draft, published, contentKa: paragraphs(kaText), contentEn: paragraphs(enText), version: draft.version || null };
    try {
      const result = await api<News>(initial.id ? `/admin/news/${initial.id}` : '/admin/news', { method: initial.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      await onSaved(result);
    } catch (e) { setError(e instanceof Error ? e.message : 'შენახვა ვერ მოხერხდა.'); }
    finally { setBusy(false); }
  }
  const ka = locale === 'ka';
  const categoryOptions = [{ label: 'სიახლე', value: 'news' }, { label: 'სტატია / ისტორია', value: 'article' }, { label: 'ბლოგი', value: 'blog' }];
  return <><Dialog visible onHide={close} header={<div><span className="eyebrow">MTA / სიახლეები</span><h2>{initial.id ? 'ნიუსის რედაქტირება' : 'ახალი ნიუსი'}</h2></div>} modal className="editor-dialog" style={{ width: '1040px', maxWidth: '97vw' }} closable={!busy && !uploading} draggable={false} footer={<div className="editor-footer"><span>{dirty ? 'არის შეუნახავი ცვლილებები' : 'ყველა ცვლილება შენახულია'}</span><div><Button label="გაუქმება" text onClick={close} disabled={busy || uploading} /><Button label={initial.published ? 'გამოქვეყნებიდან მოხსნა' : 'მონახაზად შენახვა'} outlined onClick={() => save(false)} disabled={busy || uploading} /><Button label={initial.published ? 'ცვლილებების შენახვა' : 'გამოქვეყნება'} icon="pi pi-check" onClick={() => save(true)} loading={busy} disabled={uploading} /></div></div>}>
      {error && <div className="editor-error" role="alert"><Message severity="error" text={error} /></div>}
      <div className="editor-grid"><section className="editor-copy"><div className="language-tabs" role="group" aria-label="ნიუსის ენა"><button aria-pressed={ka} className={ka ? 'selected' : ''} onClick={() => setLocale('ka')}>ქართული <span>KA</span></button><button aria-pressed={!ka} className={!ka ? 'selected' : ''} onClick={() => setLocale('en')}>English <span>EN</span></button></div>
        <div className="stack"><label htmlFor="news-title">სათაური {ka ? '(ქართულად)' : '(ინგლისურად)'}<InputText id="news-title" value={ka ? draft.titleKa : draft.titleEn} onChange={e => set(ka ? 'titleKa' : 'titleEn', e.target.value)} maxLength={200} placeholder={ka ? 'რა ხდება მთაში?' : 'What is happening in the mountains?'} /></label>
        <label htmlFor="news-excerpt">მოკლე აღწერა<InputTextarea id="news-excerpt" value={ka ? draft.excerptKa : draft.excerptEn} onChange={e => set(ka ? 'excerptKa' : 'excerptEn', e.target.value)} rows={3} maxLength={600} autoResize /><small>გამოჩნდება ნიუსის ბარათსა და საძიებო აღწერაში.</small></label>
        <label htmlFor="news-content">სრული ტექსტი<InputTextarea id="news-content" value={ka ? kaText : enText} onChange={e => ka ? setKaText(e.target.value) : setEnText(e.target.value)} rows={11} maxLength={200000} /><small>აბზაცები გამოყავით ცარიელი ხაზით. ტექსტი ინახება უსაფრთხო, უბრალო ფორმატით.</small></label></div>
        <p className="translation-note"><i className="pi pi-language" /> გამოქვეყნებამდე შეავსეთ ორივე ენა. მონახაზი შეგიძლიათ მხოლოდ ქართული სათაურითაც შეინახოთ.</p>
      </section><aside className="editor-settings"><h3>გამოქვეყნების პარამეტრები</h3><div className="stack"><label htmlFor="news-slug">ბმულის დაბოლოება<InputText id="news-slug" value={draft.slug} onChange={e => set('slug', e.target.value.toLowerCase())} disabled={!!initial.id} maxLength={150} placeholder="new-winter-season" /><small>ლათინური ასოები და ტირე. შენახვის შემდეგ უცვლელია.</small></label><label htmlFor="news-category">კატეგორია<Dropdown inputId="news-category" options={categoryOptions} value={draft.category} onChange={e => set('category', e.value)} /></label><label htmlFor="news-date">თარიღი<InputText id="news-date" type="date" value={draft.date} onChange={e => set('date', e.target.value)} /><small>სტატიის თარიღი; ავტომატურ დაგეგმვას არ ნიშნავს.</small></label>
        <div className="field-label">მთავარი ფოტო<div className="cover-preview">{draft.image ? <img src={draft.image} alt="მთავარი ფოტოს წინასწარი ნახვა" /> : <div><i className="pi pi-image" /><span>აირჩიეთ მთავარი ფოტო</span></div>}</div><label className="upload-button" htmlFor={uploadId}><i className={uploading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'} /> {draft.image ? 'ფოტოს შეცვლა' : 'ფოტოს ატვირთვა'}</label><input className="file-input" id={uploadId} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} onChange={e => { void upload(e.target.files?.[0], false); e.target.value = ''; }} /><small>JPG, PNG ან WebP · მაქსიმუმ 5 MB</small></div>
        <div className="field-label">გალერეა <small>({draft.gallery.length}/12)</small><div className="gallery">{draft.gallery.map((image, index) => <div key={image + index}><img src={image} alt={`გალერეის ფოტო ${index + 1}`} /><button type="button" aria-label={`ფოტო ${index + 1} — ამოშლა`} onClick={() => set('gallery', draft.gallery.filter((_, i) => i !== index))}><i className="pi pi-times" /></button></div>)}</div>{draft.gallery.length < 12 && <><label className="upload-button" htmlFor={uploadId + '-gallery'}><i className="pi pi-plus" /> ფოტოს დამატება</label><input className="file-input" id={uploadId + '-gallery'} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} onChange={e => { void upload(e.target.files?.[0], true); e.target.value = ''; }} /></>}</div>
        </div></aside></div>
    </Dialog><Dialog visible={discard} onHide={() => setDiscard(false)} header="შეუნახავი ცვლილებები" style={{ width: '440px', maxWidth: '95vw' }} modal footer={<><Button text label="რედაქტირების გაგრძელება" onClick={() => setDiscard(false)} /><Button severity="danger" label="ცვლილებების გაუქმება" onClick={onClose} /></>}><p>დახურვისას შეუნახავი ცვლილებები დაიკარგება.</p></Dialog></>;
}
