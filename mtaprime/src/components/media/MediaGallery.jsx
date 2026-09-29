"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export default function MediaGallery({ images, title, eyebrow, className = "" }) {
  const locale=useLocale(), items=useMemo(()=>(images||[]).filter(Boolean).slice(0,12),[images]),[active,setActive]=useState(null),[direction,setDirection]=useState(1),touch=useRef(null),close=useRef(null);
  const labels=locale==="ka"?{open:"გალერეის გახსნა",close:"გალერეის დახურვა",previous:"წინა ფოტო",next:"შემდეგი ფოტო",photo:"ფოტო"}:{open:"Open gallery",close:"Close gallery",previous:"Previous photo",next:"Next photo",photo:"Photo"};
  const show=useCallback((index,nextDirection=1)=>{if(!items.length)return;setDirection(nextDirection);setActive((index+items.length)%items.length);},[items.length]);
  useEffect(()=>{if(active===null)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";close.current?.focus();function key(event){if(event.key==="Escape")setActive(null);if(event.key==="ArrowRight")show(active+1,1);if(event.key==="ArrowLeft")show(active-1,-1);}window.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",key);};},[active,show]);
  if(!items.length)return null;
  return <section className={`media-gallery ${className}`} aria-label={title}>
    <header><div>{eyebrow&&<p>{eyebrow}</p>}<h2>{title}</h2></div><button type="button" onClick={()=>show(0)}><Expand size={16}/>{labels.open}</button></header>
    <div className={`media-gallery__grid count-${Math.min(items.length,6)}`}>{items.map((image,index)=><button type="button" key={`${image}:${index}`} onClick={()=>show(index)} aria-label={`${labels.open}: ${index+1}`}><img src={image} alt={`${title} — ${labels.photo} ${index+1}`} loading="lazy"/><span>{String(index+1).padStart(2,"0")}</span></button>)}</div>
    {active!==null&&<div className="media-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={()=>setActive(null)} onTouchStart={event=>{touch.current=event.changedTouches[0].clientX;}} onTouchEnd={event=>{if(touch.current===null)return;const delta=event.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(delta)>45)show(active+(delta<0?1:-1),delta<0?1:-1);}}>
      <button ref={close} className="media-lightbox__close" type="button" aria-label={labels.close} onClick={()=>setActive(null)}><X/></button><button className="media-lightbox__previous" type="button" aria-label={labels.previous} onClick={event=>{event.stopPropagation();show(active-1,-1);}}><ChevronLeft/></button>
      <div className="media-lightbox__frame" onClick={event=>event.stopPropagation()}><img key={active} data-direction={direction} src={items[active]} alt={`${title} — ${labels.photo} ${active+1}`}/><footer><strong>{title}</strong><span>{active+1} / {items.length}</span></footer></div>
      <button className="media-lightbox__next" type="button" aria-label={labels.next} onClick={event=>{event.stopPropagation();show(active+1,1);}}><ChevronRight/></button>
    </div>}
  </section>;
}
