'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
export default function CmsNavigation({items,onNavigate}) {
 const [open,setOpen]=useState(null);
 return <>{items.filter(item=>item.slug!=='settings').map(item=>item.children?.length?<div key={item.id} className="relative" onKeyDown={e=>{if(e.key==='Escape')setOpen(null);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(null);}}><button type="button" aria-expanded={open===item.id} onClick={()=>setOpen(open===item.id?null:item.id)} className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-opacity hover:opacity-70">{item.title}<ChevronDown size={14}/></button>{open===item.id&&<div className="mt-3 max-h-[65vh] min-w-[190px] overflow-y-auto rounded-xl bg-ink p-2 shadow-2xl min-[1440px]:absolute min-[1440px]:left-0 min-[1440px]:top-full min-[1440px]:z-50">{item.children.map(child=><Link key={child.href} href={child.href} onClick={()=>{setOpen(null);onNavigate();}} className="block rounded-lg px-4 py-3 text-sm transition hover:bg-canvas/10">{child.title}</Link>)}</div>}</div>:<Link key={item.id} href={item.href} onClick={onNavigate} className="whitespace-nowrap text-sm font-medium transition-opacity hover:opacity-70">{item.title}</Link>)}</>;
}
