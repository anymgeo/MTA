"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { CableCar, ChevronLeft, ChevronRight, MapPin, Minus, Plus, Route, Search, TriangleAlert, X } from "lucide-react";

const icons = { pin: MapPin, trail: Route, lift: CableCar, warning: TriangleAlert };
const difficultyColors = { easy: "#168354", medium: "#246ac1", difficult: "#d73b32" };
const copy = {
  en: { search:"Search the map", filters:"Layers", details:"Mountain detail", empty:"Select a trail, lift or warning on the map", updated:"Updated", open:"Open", closed:"Closed", limited:"Limited", operational:"Operational", maintenance:"Maintenance", active:"Active", resolved:"Resolved", unknown:"To be confirmed", easy:"Easy", medium:"Medium", difficult:"Difficult", all:"All features", reset:"Reset view", refresh:"Live map temporarily unavailable" },
  ka: { search:"რუკაზე ძებნა", filters:"ფენები", details:"მთის დეტალები", empty:"აირჩიეთ ტრასა, საბაგირო ან გაფრთხილება", updated:"განახლებულია", open:"ღიაა", closed:"დახურულია", limited:"შეზღუდულია", operational:"მუშაობს", maintenance:"ტექნიკური სამუშაო", active:"აქტიური", resolved:"მოგვარებულია", unknown:"დასაზუსტებელია", easy:"მარტივი", medium:"საშუალო", difficult:"რთული", all:"ყველა ობიექტი", reset:"ხედის აღდგენა", refresh:"ცოცხალი რუკა დროებით მიუწვდომელია" },
};

const anchor = value => Array.isArray(value) ? { x:value[0], y:value[1], inX:value[2], inY:value[3], outX:value[4], outY:value[5] } : value;
function pathData(points, closed=false) {
  const anchors=(points||[]).map(anchor); if(!anchors.length)return "";
  let d=`M ${anchors[0].x} ${anchors[0].y}`;
  for(let index=1;index<anchors.length;index++){const previous=anchors[index-1],current=anchors[index];const c1x=previous.outX??previous.x,c1y=previous.outY??previous.y,c2x=current.inX??current.x,c2y=current.inY??current.y;d+=` C ${c1x} ${c1y} ${c2x} ${c2y} ${current.x} ${current.y}`;}
  if(closed&&anchors.length>2){const previous=anchors.at(-1),current=anchors[0];d+=` C ${previous.outX??previous.x} ${previous.outY??previous.y} ${current.inX??current.x} ${current.inY??current.y} ${current.x} ${current.y} Z`;}return d;
}

export default function CmsTrailMap({ map: initial, resortName }) {
  const locale=useLocale(), words=copy[locale]||copy.en;
  const [map,setMap]=useState(initial),[hidden,setHidden]=useState([]),[selectedId,setSelectedId]=useState(null),[query,setQuery]=useState(""),[zoom,setZoom]=useState(1),[origin,setOrigin]=useState({x:0,y:0}),[refreshError,setRefreshError]=useState(false);
  const svg=useRef(null), drag=useRef(null);
  useEffect(()=>{let alive=true;const controller=new AbortController();async function refresh(){if(document.hidden)return;try{const response=await fetch(`/api/resort-map?slug=${encodeURIComponent(initial.id)}&locale=${locale}`,{cache:"no-store",signal:controller.signal});if(!response.ok)throw new Error();const next=await response.json();if(alive){setMap(next);setRefreshError(false);}}catch{if(alive)setRefreshError(true);}}const timer=setInterval(refresh,15000);window.addEventListener("focus",refresh);return()=>{alive=false;controller.abort();clearInterval(timer);window.removeEventListener("focus",refresh);};},[initial.id,locale]);
  const normalized=query.trim().toLocaleLowerCase();
  const features=useMemo(()=>map.features.filter(feature=>!hidden.includes(feature.kind)&&(!normalized||`${feature.name} ${feature.description}`.toLocaleLowerCase().includes(normalized))),[map.features,hidden,normalized]);
  const selected=map.features.find(feature=>feature.id===selectedId)||null;
  const typeFor=feature=>map.types.find(type=>type.key===feature.kind);
  const colorFor=feature=>feature.kind==="trail"?(difficultyColors[feature.difficulty]||"#17231f"):(typeFor(feature)?.color||"#17231f");
  const changeZoom=next=>{const value=Math.max(1,Math.min(4,next));setZoom(value);setOrigin(current=>({x:Math.max(0,Math.min(map.width-map.width/value,current.x)),y:Math.max(0,Math.min(map.height-map.height/value,current.y))}));};
  const viewBox=`${origin.x} ${origin.y} ${map.width/zoom} ${map.height/zoom}`;
  function pointer(event){const matrix=svg.current?.getScreenCTM();return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;}
  function move(event){if(!drag.current)return;const point=pointer(event);if(!point)return;const dx=drag.current.x-point.x,dy=drag.current.y-point.y;setOrigin({x:Math.max(0,Math.min(map.width-map.width/zoom,drag.current.origin.x+dx)),y:Math.max(0,Math.min(map.height-map.height/zoom,drag.current.origin.y+dy))});}
  return <section className="cms-map" aria-label={resortName}>
    <aside className="cms-map__rail"><div className="cms-map__brand"><span>LIVE MOUNTAIN MAP</span><h2>{resortName}</h2></div><label className="cms-map__search"><Search size={16}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={words.search}/></label><div className="cms-map__filters"><h3>{words.filters}</h3>{map.types.map(type=>{const Icon=icons[type.icon]||MapPin;const active=!hidden.includes(type.key);return <button type="button" aria-pressed={active} key={type.key} onClick={()=>setHidden(value=>active?[...value,type.key]:value.filter(key=>key!==type.key))}><span style={{"--layer-color":type.color}}><Icon size={16}/></span>{type.name}<i>{map.features.filter(feature=>feature.kind===type.key).length}</i></button>;})}</div><div className="cms-map__list">{features.map(feature=><button type="button" className={selectedId===feature.id?"selected":""} key={feature.id} onClick={()=>setSelectedId(feature.id)}><span style={{background:colorFor(feature)}}/>{feature.name}<small>{words[feature.difficulty]||words[feature.status]||feature.status}</small></button>)}</div></aside>
    <div className="cms-map__stage"><div className="cms-map__toolbar"><div><button type="button" aria-label="Zoom out" onClick={()=>changeZoom(zoom-.35)}><Minus/></button><strong>{Math.round(zoom*100)}%</strong><button type="button" aria-label="Zoom in" onClick={()=>changeZoom(zoom+.35)}><Plus/></button></div><button type="button" onClick={()=>{setZoom(1);setOrigin({x:0,y:0});}}>{words.reset}</button></div>{refreshError&&<p className="cms-map__offline">{words.refresh}</p>}
      <svg ref={svg} viewBox={viewBox} role="img" aria-label={resortName} onPointerDown={event=>{const point=pointer(event);if(point){event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:point.x,y:point.y,origin};}}} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
        <image href={map.image} width={map.width} height={map.height} preserveAspectRatio="xMidYMid slice"/>
        <rect width={map.width} height={map.height} fill="url(#mapShade)" pointerEvents="none"/><defs><linearGradient id="mapShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#061813" stopOpacity=".08"/><stop offset="1" stopColor="#061813" stopOpacity=".24"/></linearGradient></defs>
        {features.map(feature=>{const path=pathData(feature.points,feature.geometryKind==="polygon"),point=anchor(feature.points?.[0]||[]),color=colorFor(feature),selectedFeature=selectedId===feature.id;return feature.geometryKind==="point"?<g className="cms-map__marker" key={feature.id} transform={`translate(${point.x||0} ${point.y||0})`} onClick={event=>{event.stopPropagation();setSelectedId(feature.id);}}><circle r={selectedFeature?20:16} fill={color} stroke="white" strokeWidth="4"/><text y="6" textAnchor="middle" fill="white" fontWeight="900" fontSize="18">!</text></g>:<path key={feature.id} d={path} className={`cms-map__path ${feature.kind} ${selectedFeature?"selected":""}`} style={{"--feature-color":color}} fill={feature.geometryKind==="polygon"?`${color}33`:"none"} stroke={color} strokeWidth={selectedFeature?9:6} strokeDasharray={feature.kind==="lift"?"18 12":undefined} vectorEffect="non-scaling-stroke" onClick={event=>{event.stopPropagation();setSelectedId(feature.id);}}/>;})}
      </svg>
      <div className={`cms-map__detail ${selected?"open":""}`}>{selected?<><button className="cms-map__close" type="button" onClick={()=>setSelectedId(null)} aria-label="Close"><X/></button><div className="cms-map__detail-head"><span style={{background:colorFor(selected)}}>{selected.kind==="lift"?<CableCar/>:selected.kind==="warning"?<TriangleAlert/>:<Route/>}</span><div><small>{typeFor(selected)?.name||selected.kind}</small><h3>{selected.name}</h3></div></div><div className="cms-map__chips"><b>{words[selected.status]||selected.status}</b>{selected.difficulty&&<b>{words[selected.difficulty]||selected.difficulty}</b>}{selected.opens&&<b>{selected.opens}–{selected.closes}</b>}</div>{selected.description&&<p>{selected.description}</p>}<small>{words.updated}: {selected.updatedAt?new Date(selected.updatedAt).toLocaleString(locale):"—"}</small></>:<div className="cms-map__empty"><MapPin/><strong>{words.details}</strong><p>{words.empty}</p></div>}</div>
      <div className="cms-map__mobile-nav"><button type="button" onClick={()=>{const index=Math.max(0,features.findIndex(item=>item.id===selectedId));setSelectedId(features[(index-1+features.length)%features.length]?.id);}}><ChevronLeft/></button><span>{selected?.name||words.all}</span><button type="button" onClick={()=>{const index=Math.max(-1,features.findIndex(item=>item.id===selectedId));setSelectedId(features[(index+1)%features.length]?.id);}}><ChevronRight/></button></div>
    </div>
  </section>;
}
