"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Download, Expand, X } from "lucide-react";
import GalleryWatermark from "./GalleryWatermark";
import watermarkStyles from "./gallery-watermark.module.css";

export default function MediaGallery({ images, details, resortSlug, title, eyebrow, className = "" }) {
  const locale = useLocale();
  const photos = useMemo(() => (images || []).filter(Boolean).slice(0, 12).map((url, index) => ({
    url, index, title: details?.find(p => p.url === url)?.title || `${title} — ${locale === "ka" ? "ფოტო" : "Photo"} ${index + 1}`,
    category: details?.find(p => p.url === url)?.category || "",
  })), [images, details, title, locale]);
  const [category, setCategory] = useState(""), [active, setActive] = useState(null), [direction, setDirection] = useState(1);
  const items = photos.filter(photo => !category || photo.category === category);
  const categories = [...new Set(photos.map(p => p.category).filter(Boolean))];
  const touch = useRef(null), close = useRef(null), opener = useRef(null), dialog = useRef(null), rail = useRef(null);
  const labels = locale === "ka" ? { open: "გალერეის გახსნა", close: "გალერეის დახურვა", previous: "წინა ფოტო", next: "შემდეგი ფოტო", all: "ყველა", download: "ჩამოტვირთვა" } :
    { open: "Open gallery", close: "Close gallery", previous: "Previous photo", next: "Next photo", all: "All", download: "Download" };
  const show = useCallback((index, nextDirection = 1) => {
    if (!items.length) return;
    if (active === null) opener.current = document.activeElement;
    setDirection(nextDirection); setActive((index + items.length) % items.length);
  }, [items.length, active]);
  useEffect(() => {
    if (active === null) return;
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; close.current?.focus();
    function key(event) {
      if (event.key === "Escape") { setActive(null); opener.current?.focus(); }
      if (event.key === "ArrowRight") show(active + 1, 1);
      if (event.key === "ArrowLeft") show(active - 1, -1);
      if (event.key === "Tab") {
        const controls = [...(dialog.current?.querySelectorAll('button,a[href]') || [])];
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
      }
    }
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", key); };
  }, [active, show]);
  function hide() { setActive(null); opener.current?.focus(); }
  if (!photos.length) return null;
  const photo = active !== null ? items[active] : null;
  function slide(direction) {
    rail.current?.scrollBy({left: direction * rail.current.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  return <section className={`media-gallery ${resortSlug ? 'media-gallery--carousel' : ''} ${className}`} aria-label={title}>
    <header><div>{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2></div><button type="button" onClick={() => show(0)}><Expand size={16} />{labels.open}</button></header>
    {categories.length > 0 && <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={locale === "ka" ? "ფოტოს კატეგორია" : "Photo category"}>
      {["", ...categories].map(tag => <button key={tag} type="button" aria-pressed={category === tag} className={`rounded-full border px-4 py-2 text-sm transition ${category === tag ? "bg-ink text-canvas border-ink" : "bg-canvas text-ink border-border"}`} onClick={() => { setCategory(tag); setActive(null); }}>{tag || labels.all}</button>)}
    </div>}
    {resortSlug && items.length > 1 && <div className="gallery-rail-controls"><span>{items.length} {locale === 'ka' ? 'ფოტო · გადაფურცლეთ' : 'photos · swipe to explore'}</span><button type="button" aria-label={labels.previous} onClick={()=>slide(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label={labels.next} onClick={()=>slide(1)}><ChevronRight size={18}/></button></div>}
    <div ref={rail} className={`media-gallery__grid count-${Math.min(items.length, 6)}`}>{items.map((item, index) => <button type="button" key={item.url} onClick={() => show(index)} aria-label={`${labels.open}: ${item.title}`}>
      <Image src={item.url} alt={item.title} fill quality={75} sizes={resortSlug ? "(max-width: 800px) 88vw, (max-width: 1548px) 64vw, 970px" : index === 0 ? "(max-width: 800px) calc(100vw - 32px), (max-width: 1548px) 50vw, 750px" : "(max-width: 800px) 50vw, (max-width: 1548px) 33vw, 500px"} className="object-cover" />
      {resortSlug && <GalleryWatermark />}
      <span style={{ zIndex: 2 }}>{String(item.index + 1).padStart(2, "0")}</span>
      {resortSlug && <div className="gallery-photo-caption"><small>{item.category}</small><strong>{item.title}</strong></div>}
    </button>)}</div>
    {photo && <div ref={dialog} className="media-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={hide} onTouchStart={event => { touch.current = event.changedTouches[0].clientX; }} onTouchEnd={event => { if (touch.current === null) return; const delta = event.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(delta) > 45) show(active + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1); }}>
      <button ref={close} className="media-lightbox__close" type="button" aria-label={labels.close} onClick={hide}><X /></button>
      <button className="media-lightbox__previous" type="button" aria-label={labels.previous} onClick={event => { event.stopPropagation(); show(active - 1, -1); }}><ChevronLeft /></button>
      <div className="media-lightbox__frame" onClick={event => event.stopPropagation()}>
        <div className={watermarkStyles.photo}>
          <Image key={photo.url} data-direction={direction} src={photo.url} alt={photo.title} width={1600} height={1067} quality={80} sizes="(max-width: 800px) calc(100vw - 104px), calc(100vw - 220px)" style={{ width: 'auto', height: 'auto' }} />
          {resortSlug && <GalleryWatermark />}
        </div>
        <footer><strong>{photo.title}</strong><span>{active + 1} / {items.length}</span>{resortSlug && <a className="inline-flex items-center gap-2 text-white" href={`/api/gallery/${encodeURIComponent(resortSlug)}/${photo.index}?locale=${locale}`} download><Download size={16} />{labels.download}</a>}</footer>
      </div>
      <button className="media-lightbox__next" type="button" aria-label={labels.next} onClick={event => { event.stopPropagation(); show(active + 1, 1); }}><ChevronRight /></button>
    </div>}
  </section>;
}
