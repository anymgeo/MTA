'use client';

import { useEffect,useId,useMemo,useRef,useState, type PointerEvent } from 'react';
import { pathData, closestOnPath, moveAnchor, visibleTiles, liftTickPath, LIFT_STYLE, liftStyleForMap,cutLabelLayout } from '../../../shared/map-geometry.mjs';
import { featureColor,type MapFeature,type Point,type ResortMap } from './map-model';
type Gesture={kind:'place'|'anchor'|'handle'|'label'|'pan';index:number;side?:'in'|'out';origin:Point;point?:Point;offset?:{x:number;y:number};moved?:boolean};
type Props={map:ResortMap;draft:MapFeature|null;drawing:boolean;pan:boolean;cut?:boolean;onCut?:(feature:MapFeature,index:number,t:number)=>void;selectedVertex:number|null;
  onPoint:(point:Point)=>void;onSelect:(feature:MapFeature)=>void;onVertex:(index:number,point:Point,smooth?:boolean)=>void;
  onHandle:(index:number,side:'in'|'out',point:Point,broken:boolean)=>void;onVertexSelect:(index:number)=>void;onInsert:(index:number,t:number)=>void;
  onLabel:(point:Point)=>void;onHover:(feature:MapFeature|null)=>void;onFinish:()=>void;onGeometryStart:()=>void;onGeometryEnd:()=>void;onActiveChange?:(active:boolean)=>void};

export default function MapCanvas({map,draft,drawing,pan,cut=false,onCut,selectedVertex,onPoint,onSelect,onVertex,onHandle,onVertexSelect,onInsert,onLabel,onHover,onFinish,onGeometryStart,onGeometryEnd,onActiveChange}:Props){
  const cutPrefix=useId().replaceAll(':','');
  const host=useRef<HTMLDivElement>(null),gesture=useRef<Gesture|null>(null),lastPlace=useRef<{point:Point;time:number}|null>(null);
  const [size,setSize]=useState({width:900,height:700}),[view,setView]=useState({zoom:1,x:0,y:0}),[preview,setPreview]=useState<Point|null>(null),[dragging,setDragging]=useState(false);
  const imageUrl=map.tiles?.previewUrl||(map.imageUrl.startsWith('/media/')?map.imageUrl:'/assets'+map.imageUrl);
  const [imageStatus,setImageStatus]=useState({url:'',ready:false,error:false});
  const loaded=imageStatus.url===imageUrl&&imageStatus.ready,failed=imageStatus.url===imageUrl&&imageStatus.error;
  useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(host.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{let active=true;const image=new window.Image();image.onload=()=>{if(active)setImageStatus({url:imageUrl,ready:true,error:false});};image.onerror=()=>{if(active)setImageStatus({url:imageUrl,ready:false,error:true});};image.src=imageUrl;return()=>{active=false;};},[imageUrl]);
  const fit=Math.min(size.width/map.width,size.height/map.height),scale=fit*view.zoom,x=(size.width-map.width*scale)/2+view.x,y=(size.height-map.height*scale)/2+view.y;
  const features=useMemo(()=>[...map.features.filter(f=>f.id!==draft?.id),...(draft?[draft]:[])],[map.features,draft]);
  const tickPaths=useMemo(()=>new Map(features.filter(f=>f.typeKey==='lift').map(f=>[f,liftTickPath(f.points,liftStyleForMap({width:map.width,height:map.height}))])),[features,map.width,map.height]);
  // Preview the full tentative lift, so spacing continues across all committed anchors.
  const previewPoints=draft&&preview?[...draft.points,preview]:[];
  const tiles=map.tiles?visibleTiles(map.tiles,scale,x,y,size.width,size.height):[];
  function screen(event:{clientX:number;clientY:number}){const box=host.current!.getBoundingClientRect();return [event.clientX-box.left,event.clientY-box.top] as Point;}
  function world(event:{clientX:number;clientY:number}){const p=screen(event);return [(p[0]-x)/scale,(p[1]-y)/scale] as Point;}
  function bound(p:Point):Point{return [Math.max(0,Math.min(map.width,p[0])),Math.max(0,Math.min(map.height,p[1]))];}
  function down(event:PointerEvent<HTMLDivElement>){
    if(event.button!==0||!loaded)return;host.current?.focus();onActiveChange?.(true);
    const p=world(event),target=event.target as SVGElement,kind=target.dataset.edit,index=Number(target.dataset.index),current={draft,drawing,pan,view,size};
    if(cut&&!pan){const feature=features.find(f=>(f.id||'draft')===target.dataset.feature);if(feature?.geometryKind==='line'){const hit=closestOnPath(feature.points,p,false,.2/scale);if(hit.distance*scale<15)onCut?.(feature,hit.index,hit.t);}return;}
    if(current.pan){gesture.current={kind:'pan',index:0,origin:screen(event),offset:{x:current.view.x,y:current.view.y}};}
    else if(!current.drawing&&current.draft&&kind){
      onGeometryStart();if(kind!=='label')onVertexSelect(index);
      if(kind==='handle'&&event.altKey)onHandle(index,target.dataset.side as 'in'|'out',p,true);
      gesture.current={kind:kind as Gesture['kind'],index,side:target.dataset.side as 'in'|'out',origin:p,point:kind==='anchor'?[...current.draft.points[index]]:undefined};
    }else if(current.drawing&&current.draft){
      if(p[0]<0||p[1]<0||p[0]>map.width||p[1]>map.height)return;
      const last=current.draft.points.at(-1);if(last&&Math.hypot((p[0]-last[0])*scale,(p[1]-last[1])*scale)<8){if(lastPlace.current&&performance.now()-lastPlace.current.time<420){onFinish();lastPlace.current=null;}else lastPlace.current={point:p,time:performance.now()};return;}
      onGeometryStart();onPoint(p);gesture.current=current.draft.geometryKind==='point'?null:{kind:'place',index:current.draft.points.length,origin:p};
      lastPlace.current={point:p,time:performance.now()};if(!gesture.current)onGeometryEnd();
    }else{const feature=features.find(f=>(f.id||'draft')===target.dataset.feature);if(feature)onSelect(feature);return;}
    setDragging(Boolean(gesture.current));host.current?.setPointerCapture(event.pointerId);event.preventDefault();
  }
  function move(event:PointerEvent<HTMLDivElement>){
    const p=world(event),g=gesture.current;setPreview(p);if(!g)return;
    if(g.kind==='pan'){const s=screen(event);setView(v=>({...v,x:g.offset!.x+s[0]-g.origin[0],y:g.offset!.y+s[1]-g.origin[1]}));return;}
    if(g.kind==='place'){const dx=p[0]-g.origin[0],dy=p[1]-g.origin[1];if(Math.hypot(dx,dy)*scale>3){g.moved=true;onVertex(g.index,[g.origin[0],g.origin[1],g.origin[0]-dx,g.origin[1]-dy,g.origin[0]+dx,g.origin[1]+dy],true);}return;}
    if(g.kind==='anchor')onVertex(g.index,moveAnchor(g.point!,bound([g.point![0]+p[0]-g.origin[0],g.point![1]+p[1]-g.origin[1]])));
    if(g.kind==='handle')onHandle(g.index,g.side!,p,event.altKey);
    if(g.kind==='label')onLabel(bound(p));
  }
  function up(event:PointerEvent<HTMLDivElement>){if(gesture.current&&gesture.current.kind!=='pan')onGeometryEnd();gesture.current=null;setDragging(false);if(host.current?.hasPointerCapture(event.pointerId))host.current.releasePointerCapture(event.pointerId);}
  function zoomAt(zoom:number,focus:Point=[size.width/2,size.height/2]){const z=Math.max(.05,Math.min(64,zoom)),p=[(focus[0]-x)/scale,(focus[1]-y)/scale],s=fit*z;setView({zoom:z,x:focus[0]-p[0]*s-(size.width-map.width*s)/2,y:focus[1]-p[1]*s-(size.height-map.height*s)/2});}
  useEffect(()=>{const el=host.current;if(!el)return;const wheel=(event:WheelEvent)=>{event.preventDefault();zoomAt(view.zoom*Math.exp(-event.deltaY*.0015),screen(event));};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);});
  return <div className="map-canvas-wrap">
    <div className="map-canvas-chrome"><div className="map-canvas-badge">{map.width.toLocaleString()} × {map.height.toLocaleString()} px · {map.tiles?'Tiled':'Original'}</div><div className="map-zoom"><button type="button" aria-label="Zoom out" onClick={()=>zoomAt(view.zoom/1.25)}>−</button><button type="button" onClick={()=>setView({zoom:1,x:0,y:0})}>მორგება / Fit</button><span>{Math.round(view.zoom*100)}%</span><button type="button" aria-label="Zoom in" onClick={()=>zoomAt(view.zoom*1.25)}>+</button></div></div>
    <div ref={host} className="map-canvas" aria-label="რუკის სახატავი სივრცე / Map drawing canvas" tabIndex={0} style={{touchAction:'none',cursor:pan?'grab':drawing?'crosshair':'default'}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerEnter={()=>onActiveChange?.(true)} onPointerLeave={()=>{if(!gesture.current)setPreview(null);}}>
      <svg width="100%" height="100%" data-map-canvas="vector" data-scale={scale} data-offset-x={x} data-offset-y={y} aria-label="Vector paths" onDoubleClick={event=>{if(drawing){onFinish();return;}if(!draft||pan)return;const target=event.target as SVGElement;if(target.dataset.feature===(draft.id||'draft')&&!target.dataset.edit){const hit=closestOnPath(draft.points,world(event),draft.geometryKind==='polygon',.2/scale);if(hit.distance*scale<12&&hit.t>.001&&hit.t<.999)onInsert(hit.index,hit.t);}}}>
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
          <image href={imageUrl} width={map.width} height={map.height} preserveAspectRatio="none" pointerEvents="none"/>
          {tiles.map(tile=><image key={tile.key} href={tile.url} x={tile.x} y={tile.y} width={tile.width} height={tile.height} preserveAspectRatio="none" pointerEvents="none"/>)}
          {features.map((f,i)=>{const color=featureColor(f,map.types),active=f===draft,id=f.id||'draft',d=pathData(f.points,f.geometryKind==='polygon'),cutLayout=cutLabelLayout(f.points,f.label,map,scale,f.label?.textKa||f.label?.textEn||''),maskId=`${cutPrefix}-cut-${id}`;return <g key={id+'-'+i} data-feature-group={id}>
            {cutLayout&&<defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={map.width} height={map.height}><rect width={map.width} height={map.height} fill="white"/><rect data-line-cut={id} x={cutLayout.x-cutLayout.width/2} y={cutLayout.y-cutLayout.height/2} width={cutLayout.width} height={cutLayout.height} fill="black" transform={`rotate(${cutLayout.angle} ${cutLayout.x} ${cutLayout.y})`}/></mask></defs>}
            {f.geometryKind==='point'?f.points[0]&&(f.typeKey==='label'?<text data-feature={id} data-edit={active&&!drawing?'anchor':undefined} data-index="0" x={f.points[0][0]} y={f.points[0][1]} fontSize={13/scale} fontWeight="700" fill={color} stroke="white" strokeWidth={3/scale} paintOrder="stroke" strokeLinejoin="round">{f.nameKa||f.nameEn}</text>:<g data-feature={id}><circle cx={f.points[0][0]} cy={f.points[0][1]} r={11/scale} fill={color} stroke="white" strokeWidth={2/scale} data-feature={id} data-edit={active&&!drawing?'anchor':undefined} data-index="0"/><text x={f.points[0][0]} y={f.points[0][1]+4/scale} fill="white" fontSize={14/scale} textAnchor="middle" pointerEvents="none">{['warning','official-hazard'].includes(f.typeKey)?'!':f.typeKey==='parking'?'P':f.typeKey==='first-aid'?'+':'•'}</text></g>):<>
              <path d={d} mask={cutLayout?`url(#${maskId})`:undefined} fill={f.geometryKind==='polygon'?color+'22':'none'} stroke="white" strokeWidth={active?8:6} vectorEffect="non-scaling-stroke" pointerEvents="none"/>
              <path d={d} mask={cutLayout?`url(#${maskId})`:undefined} data-vector-path={id} data-render-style={f.typeKey==='lift'?'lift-ticked':undefined} visibility={f.typeKey==='lift'&&active&&drawing&&preview&&!dragging?'hidden':undefined} fill="none" stroke={color} strokeWidth={f.typeKey==='lift'?LIFT_STYLE.strokeWidth:active?4:3} vectorEffect="non-scaling-stroke" pointerEvents="none"/>
              {f.typeKey==='lift'&&<path mask={cutLayout?`url(#${maskId})`:undefined} data-lift-ticks={id} visibility={active&&drawing&&preview&&!dragging?'hidden':undefined} d={tickPaths.get(f)} fill="none" stroke={color} strokeWidth={LIFT_STYLE.tickStrokeWidth} vectorEffect="non-scaling-stroke" pointerEvents="none"/>}
              <path d={d} data-feature={id} fill={f.geometryKind==='polygon'?'transparent':'none'} stroke="transparent" strokeWidth="20" vectorEffect="non-scaling-stroke" onPointerEnter={()=>{if(!drawing)onHover(f);}} onPointerLeave={()=>onHover(null)}/>
            </>}
          </g>;})}
          {drawing&&draft&&draft.geometryKind!=='point'&&draft.points.length>0&&preview&&!dragging&&<g pointerEvents="none" opacity=".7">
            <path d={pathData(draft.typeKey==='lift'?previewPoints:[draft.points.at(-1)!,preview])} fill="none" stroke={featureColor(draft,map.types)} strokeWidth={draft.typeKey==='lift'?LIFT_STYLE.strokeWidth:2} strokeDasharray={draft.typeKey==='lift'?undefined:`${7/scale} ${5/scale}`} vectorEffect="non-scaling-stroke" data-pen-preview="true"/>
            {draft.typeKey==='lift'&&<path data-lift-preview-ticks="true" d={liftTickPath(previewPoints,liftStyleForMap(map))} fill="none" stroke={featureColor(draft,map.types)} strokeWidth={LIFT_STYLE.tickStrokeWidth} vectorEffect="non-scaling-stroke"/>}
          </g>}
          {/* Labels above every hit path; active handles above labels. Overlapping routes
              must not intercept clicks or drags intended for a visible name. */}
          {features.filter(f=>f.label).map(f=>{const id=f.id||'draft',active=f===draft,color=featureColor(f,map.types),label=f.label!,cutLayout=cutLabelLayout(f.points,label,map,scale,label.textKa||label.textEn||'');return <text key={'label-'+id} data-feature={id} data-edit={active&&!drawing?'label':undefined} data-cut-label={cutLayout?id:undefined} x={cutLayout?.x??label.x} y={cutLayout?.y??label.y} transform={cutLayout?`rotate(${cutLayout.angle} ${cutLayout.x} ${cutLayout.y})`:undefined} textAnchor={cutLayout?'middle':undefined} dominantBaseline={cutLayout?'central':undefined} fontSize={cutLayout?.fontSize??15/scale} fontWeight="700" fill={color} stroke="white" strokeWidth={(cutLayout?2:4)/scale} paintOrder="stroke" strokeLinejoin="round" style={{cursor:active?'move':'pointer'}}>{label.textKa||label.textEn||(cutLayout?'':f.nameKa)}</text>;})}
          {draft&&!pan&&draft.geometryKind!=='point'&&draft.points.map((p,index)=>{const color=featureColor(draft,map.types);return <g key={'anchor-'+index}>
            {index===selectedVertex&&(['in','out'] as const).map(side=>{const hi=side==='in'?2:4,hx=p[hi]??p[0],hy=p[hi+1]??p[1];return <g key={side}><line x1={p[0]} y1={p[1]} x2={hx} y2={hy} stroke="#65788b" strokeWidth={1/scale} pointerEvents="none"/><circle data-edit="handle" data-index={index} data-side={side} cx={hx} cy={hy} r={6/scale} fill="white" stroke={color} strokeWidth={2/scale} style={{cursor:'crosshair'}}/></g>;})}
            <rect data-edit="anchor" data-index={index} x={p[0]-5/scale} y={p[1]-5/scale} width={10/scale} height={10/scale} fill={index===selectedVertex?color:'white'} stroke={index===selectedVertex?'white':color} strokeWidth={2/scale} style={{cursor:drawing?'crosshair':'move'}}/>
          </g>;})}
        </g>
      </svg>
      {failed?<div className="map-canvas-state" role="alert">რუკის ფოტო ვერ ჩაიტვირთა / Image could not load</div>:!loaded?<div className="map-canvas-state" role="status">რუკა იტვირთება / Loading map…</div>:null}
    </div><div className="map-canvas-footer"><span>Space · Pan / Wheel · Zoom</span><span>Alt + handle · Corner / Double-click segment · Insert anchor</span><span>{drawing?`${draft?.points.length||0} anchors`:'Ready'}</span></div>
  </div>;
}
