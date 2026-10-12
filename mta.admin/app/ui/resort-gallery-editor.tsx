'use client';
import { useId, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { api } from './api';
import { preview, type ResortContent } from './resort-model';

type Photo = NonNullable<ResortContent['galleryDetails']>[number];
export default function ResortGalleryEditor({ images, ka, en, disabled, onBusy, onChange }: {
  images: string[]; ka?: Photo[]; en?: Photo[]; disabled: boolean;
  onBusy: (busy: boolean) => void;
  onChange: (images: string[], ka: Photo[], en: Photo[]) => void;
}) {
  const id = useId(), [error, setError] = useState('');
  const details = (language: 'ka' | 'en') => images.map((url, i) =>
    (language === 'ka' ? ka : en)?.find(p => p.url === url) ||
    { url, title: `${language === 'ka' ? 'ფოტო' : 'Photo'} ${i + 1}`, category: language === 'ka' ? 'ზამთარი' : 'Winter' });
  const update = (index: number, language: 'ka' | 'en', field: 'title' | 'category', value: string) => {
    const a = details('ka'), b = details('en');
    (language === 'ka' ? a : b)[index] = { ...(language === 'ka' ? a : b)[index], [field]: value };
    onChange(images, a, b);
  };
  function reorder(index: number, direction: number) {
    const order = images.map((_, i) => i), target = index + direction;
    [order[index], order[target]] = [order[target], order[index]];
    onChange(order.map(i => images[i]), order.map(i => details('ka')[i]), order.map(i => details('en')[i]));
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.length + images.length > 12) { setError('Maximum 12 photos. Remove a photo or select fewer files.'); return; }
    if (selected.some(file => file.size > 45 * 1024 * 1024)) { setError('Each original must be 45 MB or smaller.'); return; }
    onBusy(true); setError('');
    // Commit every successful upload so a later failure cannot discard the batch.
    const urls = [...images], a = details('ka'), b = details('en');
    try {
      for (const file of selected) {
        const body = new FormData(); body.set('file', file);
        const { url } = await api<{ url: string }>('/admin/gallery-photo', { method: 'POST', body, signal: AbortSignal.timeout(120000) });
        const name = file.name.replace(/\.[^.]+$/, '').slice(0, 200);
        urls.push(url); a.push({ url, title: name, category: 'ზამთარი' }); b.push({ url, title: name, category: 'Winter' });
        onChange([...urls], [...a], [...b]);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { onBusy(false); }
  }
  return <div className="resort-gallery-admin">
    <div className="subsection-heading"><div><h3>Photo gallery</h3><p>Up to 12 original photos · bilingual titles and categories · save the resort to publish.</p></div><span>{images.length}/12</span></div>
    {error && <p role="alert" className="inline-error">{error}</p>}
    <fieldset disabled={disabled}><div className="resort-gallery-admin__grid">
      {images.map((url, index) => <article key={url}>
        <img src={preview(url)} alt={details('en')[index].title} loading="lazy" />
        <div><button type="button" disabled={index === 0} onClick={() => reorder(index, -1)} aria-label={`Move photo ${index + 1} earlier`}><i className="pi pi-arrow-left" /></button><span>{index + 1}</span><button type="button" disabled={index === images.length - 1} onClick={() => reorder(index, 1)} aria-label={`Move photo ${index + 1} later`}><i className="pi pi-arrow-right" /></button><button type="button" onClick={() => onChange(images.filter((_, i) => i !== index), details('ka').filter((_, i) => i !== index), details('en').filter((_, i) => i !== index))} aria-label={`Remove photo ${index + 1}`}><i className="pi pi-trash" /></button></div>
        <div className="resort-gallery-admin__fields">{(['ka', 'en'] as const).map(language => <div key={language} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <label>Title · {language.toUpperCase()} *<InputText required value={details(language)[index].title} maxLength={200} onChange={e => update(index, language, 'title', e.target.value)} /></label>
          <label>Category · {language.toUpperCase()} *<InputText required list={`${id}-${language}`} value={details(language)[index].category} maxLength={80} onChange={e => update(index, language, 'category', e.target.value)} /></label>
        </div>)}</div>
      </article>)}
    </div>{(['ka', 'en'] as const).map(language => <datalist key={language} id={`${id}-${language}`}>{[...new Set(details(language).map(p => p.category))].map(category => <option key={category} value={category} />)}</datalist>)}
    {images.length < 12 && <><label className="upload-button" htmlFor={id}><i className="pi pi-plus" /> Upload photos</label><input id={id} className="file-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files); e.target.value = ''; }} /></>}
    </fieldset>
    <p className="translation-note">Type a new category to create it; edit matching tags to rename it. Originals stay clean; downloads receive the MTA watermark.</p>
  </div>;
}
