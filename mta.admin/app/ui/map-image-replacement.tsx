'use client';

import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import MapCanvas from './map-canvas';
import {alignPoint,defaultAlignment,type MapAlignment, type MapTiles} from '../../../shared/map-geometry.mjs';
import type {Point,ResortMap} from './map-model';

export type PendingMapImage={token:string;mapVersion:string;imageUrl:string;width:number;height:number;tiles:MapTiles};
const noop=()=>{};
export default function MapImageReplacement({map,pending,busy,error,onConfirm,onCancel}:{map:ResortMap;pending:PendingMapImage;busy:boolean;error:string;onConfirm:(alignment:MapAlignment)=>void;onCancel:()=>void}) {
  const [alignment,setAlignment]=useState(()=>defaultAlignment(map,pending)),[confirmed,setConfirmed]=useState(!map.features.length),[opacity,setOpacity]=useState(.8);
  const root=useRef<HTMLDivElement>(null);
  const valid=Object.values(alignment).every(Number.isFinite)&&alignment.scaleX>0&&alignment.scaleY>0;
  const preview=useMemo(()=>({...map,...pending,features:map.features.map(f=>({...f,points:f.points.map(p=>alignPoint(p,alignment) as Point),label:f.label?{...f.label,x:alignPoint([f.label.x,f.label.y],alignment)[0],y:alignPoint([f.label.x,f.label.y],alignment)[1],pathPosition:f.label.cutLine?null:f.label.pathPosition}:null}))}),[map,pending,alignment]);
  const outside=preview.features.filter(f=>f.points.some(p=>p[0]<0||p[1]<0||p[0]>pending.width||p[1]>pending.height)).length;
  const changedAspect=Math.abs((pending.width/pending.height)/(map.width/map.height)-1)>.005;
  useEffect(()=>{root.current?.querySelector<HTMLButtonElement>('button')?.focus();},[]);
  return <div className="map-replacement-overlay" onKeyDown={event=>{
    if(event.key==='Escape'&&!busy){event.preventDefault();onCancel();}
    if(event.key==='Tab'){const items=[...root.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')],first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    event.stopPropagation();
  }}>
    <div ref={root} className="map-image-replacement" role="dialog" aria-modal="true" aria-labelledby="map-replacement-title">
      <header><div><h3 id="map-replacement-title">ახალი ფონის გასწორება / Align replacement image</h3><p>{map.width.toLocaleString()} × {map.height.toLocaleString()} → {pending.width.toLocaleString()} × {pending.height.toLocaleString()} px · {map.features.length} drawings preserved</p></div><button type="button" disabled={busy} onClick={onCancel}>გაუქმება / Cancel</button></header>
      <div className="map-replacement-layout">
        <div className="map-replacement-preview" style={{'--replacement-opacity':opacity} as CSSProperties}>
          <MapCanvas key={pending.imageUrl} map={preview} draft={null} drawing={false} pan={true} selectedVertex={null} onPoint={noop} onSelect={noop} onVertex={noop} onHandle={noop} onVertexSelect={noop} onInsert={noop} onLabel={noop} onHover={noop} onFinish={noop} onGeometryStart={noop} onGeometryEnd={noop}/>
        </div>
        <form onSubmit={event=>{event.preventDefault();if(valid&&confirmed)onConfirm(alignment);}}><fieldset disabled={busy}>
          <p>მოქმედი რუკა ჯერ უცვლელია. გადაამოწმეთ გეოგრაფიული შესაბამისობა. / The live map is unchanged. Check geographic alignment before confirming.</p>
          {changedAspect&&<p className="map-note">განსხვავებული პროპორცია: ნახაზები თავდაპირველად ერთგვაროვნად მასშტაბირდება. / Different aspect ratio: uniform scaling is used initially, without stretching.</p>}
          <div className="map-alignment-presets"><button type="button" onClick={()=>{setAlignment(defaultAlignment(map,pending));setConfirmed(false);}}>მორგება / Uniform fit</button><button type="button" onClick={()=>{setAlignment(defaultAlignment(map,pending,true));setConfirmed(false);}}>პროპორციული X/Y / Scale X/Y</button></div>
          {([['scaleX','Scale X / მასშტაბი X'],['scaleY','Scale Y / მასშტაბი Y'],['rotation','Rotation ° / ბრუნვა'],['offsetX','Offset X px / წანაცვლება X'],['offsetY','Offset Y px / წანაცვლება Y']] as const).map(([key,label])=><label key={key}><span>{label}</span><input type="number" step={key.startsWith('scale')?'0.001':key==='rotation'?'0.1':'1'} value={alignment[key]} onChange={event=>{const value=Number(event.target.value);if(Number.isFinite(value)){setAlignment({...alignment,[key]:value});setConfirmed(false);}}}/></label>)}
          <label><span>ფონის გამჭვირვალობა / Background opacity</span><input type="range" min="0.15" max="1" step=".05" value={opacity} onChange={event=>setOpacity(+event.target.value)}/></label>
          {outside>0&&<p className="map-note">{outside} feature(s) extend beyond the new image. They will be preserved, not cropped or deleted. Adjust alignment if necessary.</p>}
          <label className="map-alignment-confirm"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>ვადასტურებ გეოგრაფიულ გასწორებას / I verified geographic alignment</span></label>
          {error&&<p role="alert" className="editor-banner error">{error}</p>}
          <button type="submit" className="map-primary-action" disabled={!valid||!confirmed||busy}>{busy?'ინახება / Saving…':'დადასტურება და შენახვა / Confirm replacement'}</button>
          <small>Original source bytes are unchanged. Anchors, both Bézier handles, labels and metadata are retained. This does not retrace or infer geographic positions.</small>
        </fieldset></form>
      </div>
    </div>
  </div>;
}
