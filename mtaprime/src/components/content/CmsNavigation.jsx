'use client';
import { useState } from 'react';
import { Activity, ArrowUpRight, ChevronDown, Map, Mountain, Video } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ResortIcon from '@/components/brand/ResortIcon';
const menuIcons = { map: Map, status: Activity, cameras: Video };
export default function CmsNavigation({items,onNavigate}) {
 const [open,setOpen]=useState(null);
 function close() { setOpen(null); onNavigate(); }
 return <>{items.filter(item=>item.slug!=='settings').map(item=> {
   if (!item.children?.length) return <Link key={item.id} href={item.href} onClick={close} className="site-nav-label">{item.title}</Link>;
   const expanded = open === item.id, panelId = `navigation-${item.id}`;
   return <div key={item.id} className="site-nav-group" onKeyDown={event=>{if(event.key==='Escape'){setOpen(null);event.currentTarget.querySelector('button')?.focus();}}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(null);}}>
     {item.menuKind === 'today' ? <div className="flex items-center gap-1"><Link href={item.href} onClick={close} className="site-nav-label">{item.title}</Link><button type="button" aria-label={item.title} aria-expanded={expanded} aria-controls={panelId} onClick={()=>setOpen(expanded?null:item.id)} className="site-nav-label"><ChevronDown size={14} className={expanded?'rotate-180':''}/></button></div> : <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={()=>setOpen(expanded?null:item.id)} className="site-nav-label">{item.title}<ChevronDown size={14} className={expanded?'rotate-180':''}/></button>}
     {expanded&&<div id={panelId} className={`site-nav-panel site-nav-panel-${item.menuKind||'standard'}`}>
       {item.introTitle&&<Link href={item.introHref||item.href} onClick={close} className="site-nav-intro"><Mountain size={22} aria-hidden="true"/><span><strong>{item.introTitle}</strong>{item.description&&<small>{item.description}</small>}</span><ArrowUpRight size={17} aria-hidden="true"/></Link>}
       {item.children.map(child=> {
         const Icon = menuIcons[child.iconKey];
         const content = <>{child.resortSlug?<ResortIcon slug={child.resortSlug} className="h-8 w-8 shrink-0"/>:Icon?<span className="site-nav-icon"><Icon size={21} aria-hidden="true"/></span>:null}<span><strong>{child.title}</strong>{child.description&&<small>{child.description}</small>}</span>{!child.disabled&&<ArrowUpRight size={15} className="site-nav-arrow" aria-hidden="true"/>}</>;
         return child.disabled?<div key={child.title} className="site-nav-child" aria-disabled="true">{content}</div>:<Link key={child.href} href={child.href} onClick={close} className="site-nav-child">{content}</Link>;
       })}
     </div>}
   </div>;
 })}</>;
}
