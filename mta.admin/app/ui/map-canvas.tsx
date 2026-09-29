'use client';
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as CanvasImage, Circle, Group, Line, Shape, Text } from 'react-konva';
import type Konva from 'konva';
import { featureColor, type MapFeature, type Point, type ResortMap } from './map-model';

type HandleSide = 'in' | 'out';

function pathScene(points: Point[], closed: boolean) {
  return (ctx: Konva.Context, shape: Konva.Shape) => {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    const segment = (from: Point, to: Point) => ctx.bezierCurveTo(from[4] ?? from[0], from[5] ?? from[1], to[2] ?? to[0], to[3] ?? to[1], to[0], to[1]);
    for (let index = 1; index < points.length; index += 1) segment(points[index - 1], points[index]);
    if (closed && points.length > 2) { segment(points.at(-1)!, points[0]); ctx.closePath(); }
    ctx.fillStrokeShape(shape);
  };
}

function nearestSegment(points: Point[], target: Point, closed: boolean) {
  const count = closed ? points.length : points.length - 1;
  let best = 0, distance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < count; index += 1) {
    const a = points[index], b = points[(index + 1) % points.length];
    for (let sample = 0; sample <= 20; sample += 1) {
      const t = sample / 20, mt = 1 - t;
      const x = mt ** 3 * a[0] + 3 * mt ** 2 * t * (a[4] ?? a[0]) + 3 * mt * t ** 2 * (b[2] ?? b[0]) + t ** 3 * b[0];
      const y = mt ** 3 * a[1] + 3 * mt ** 2 * t * (a[5] ?? a[1]) + 3 * mt * t ** 2 * (b[3] ?? b[1]) + t ** 3 * b[1];
      const next = (x - target[0]) ** 2 + (y - target[1]) ** 2;
      if (next < distance) { distance = next; best = index; }
    }
  }
  return best + 1;
}

export default function MapCanvas({ map, draft, drawing, pan, selectedVertex, onPoint, onSelect, onVertex, onHandle, onVertexSelect, onInsert, onHover }: {
  map: ResortMap; draft: MapFeature | null; drawing: boolean; pan: boolean; selectedVertex: number | null;
  onPoint:(p:Point)=>void; onSelect:(f:MapFeature)=>void; onVertex:(i:number,p:Point)=>void;
  onHandle:(i:number,side:HandleSide,p:Point)=>void; onVertexSelect:(i:number)=>void; onInsert:(i:number,p:Point)=>void;
  onHover:(f:MapFeature|null)=>void;
}) {
  const host = useRef<HTMLDivElement>(null), group = useRef<Konva.Group>(null);
  const placing = useRef<{ index:number; origin:Point } | null>(null);
  const [width,setWidth]=useState(600), [image,setImage]=useState<HTMLImageElement>(), [failed,setFailed]=useState(false);
  const [zoom,setZoom]=useState(1), [offset,setOffset]=useState({x:0,y:0});
  useEffect(()=>{const el=host.current!; const observer=new ResizeObserver(()=>setWidth(el.clientWidth));observer.observe(el);return()=>observer.disconnect();},[]);
  useEffect(()=>{let active=true;const img=new window.Image();img.onload=()=>{if(active){setImage(img);setFailed(false);}};img.onerror=()=>{if(active)setFailed(true);};img.src=map.imageUrl.startsWith('/media/')?map.imageUrl:'/assets'+map.imageUrl;return()=>{active=false;};},[map.imageUrl]);
  const height=Math.min(650,Math.max(320,width*map.height/map.width)), scale=Math.min(width/map.width,height/map.height)*zoom;
  const bound=(p:Point):Point=>[Math.max(0,Math.min(map.width,p[0])),Math.max(0,Math.min(map.height,p[1]))];
  const rawPointer=()=>{const p=group.current?.getRelativePointerPosition();return p?[Math.round(p.x*100)/100,Math.round(p.y*100)/100] as Point:null;};
  const pointer=()=>{const p=rawPointer();return p?bound(p):null;};
  function startPoint(event:Konva.KonvaEventObject<MouseEvent|TouchEvent>){
    if(!drawing || pan || !image || failed || !draft)return;
    const p=rawPointer(); if(!p||p[0]<0||p[0]>map.width||p[1]<0||p[1]>map.height)return;
    onPoint(p); onVertexSelect(draft.points.length);
    if(draft.geometryKind!=='point') placing.current={index:draft.points.length,origin:p};
    event.cancelBubble=true;
  }
  function curvePoint(){
    if(!placing.current || !drawing)return;
    const p=pointer();if(!p)return;
    const {index,origin}=placing.current, dx=p[0]-origin[0],dy=p[1]-origin[1];
    if(Math.abs(dx)+Math.abs(dy)>2) onVertex(index,[origin[0],origin[1],origin[0]-dx,origin[1]-dy,origin[0]+dx,origin[1]+dy]);
  }
  const finishPoint=()=>{placing.current=null;};
  const features=[...map.features.filter(f=>f.id!==draft?.id),...(draft?[draft]:[])];
  return <div className="map-canvas-wrap"><div className="map-zoom"><button type="button" onClick={()=>setZoom(z=>Math.min(5,z+0.25))}>＋</button><button type="button" onClick={()=>setZoom(z=>Math.max(1,z-0.25))}>−</button><button type="button" onClick={()=>{setZoom(1);setOffset({x:0,y:0});}}>მორგება / Fit</button><span>{Math.round(zoom*100)}%</span></div>
    <div ref={host} className="map-canvas" aria-label="რუკის სახატავი სივრცე / Map drawing canvas" style={{touchAction:'none'}}>
      <Stage width={width} height={height} onMouseDown={startPoint} onTouchStart={startPoint} onMouseMove={curvePoint} onTouchMove={curvePoint} onMouseUp={finishPoint} onTouchEnd={finishPoint}>
        <Layer><Group ref={group} x={(width-map.width*scale)/2+offset.x} y={(height-map.height*scale)/2+offset.y} scaleX={scale} scaleY={scale} draggable={pan}
          onDragEnd={e=>{if(e.target.getClassName()==='Group')setOffset({x:e.target.x()-(width-map.width*scale)/2,y:e.target.y()-(height-map.height*scale)/2});}}>
          {image && <CanvasImage image={image} width={map.width} height={map.height} />}
          {features.map((f,index)=>{const color=featureColor(f,map.types),active=f===draft;
            const select=(e:Konva.KonvaEventObject<MouseEvent|TouchEvent>)=>{if(!drawing&&!pan){e.cancelBubble=true;onSelect(f);}};
            const hover=(value:boolean)=>{if(!drawing&&!pan)onHover(value?f:null);};
            const insert=(e:Konva.KonvaEventObject<MouseEvent|TouchEvent>)=>{if(active&&!drawing&&!pan){const p=pointer();if(p){e.cancelBubble=true;const at=nearestSegment(f.points,p,f.geometryKind==='polygon');onInsert(at,p);onVertexSelect(at);}}};
            return <Group key={f.id||'draft-'+index}>
            {f.geometryKind!=='point' && <Shape sceneFunc={pathScene(f.points,f.geometryKind==='polygon')} stroke={color} strokeWidth={(active?5:3)/scale} hitStrokeWidth={22/scale} lineCap="round" lineJoin="round" fill={f.geometryKind==='polygon'?color+'33':undefined} dash={f.typeKey==='lift'?[10/scale,6/scale]:undefined} onClick={select} onTap={select} onDblClick={insert} onDblTap={insert} onMouseEnter={()=>hover(true)} onMouseLeave={()=>hover(false)} />}
            {f.geometryKind==='point' && f.points[0] && <Group x={f.points[0][0]} y={f.points[0][1]} onClick={select} onTap={select} onMouseEnter={()=>hover(true)} onMouseLeave={()=>hover(false)}>
              <Circle radius={14/scale} fill={color} stroke="#fff" strokeWidth={2/scale}/><Text text={f.typeKey==='warning'?'!':'•'} x={-8/scale} y={-10/scale} width={16/scale} align="center" fontSize={20/scale} fontStyle="bold" fill="#fff" listening={false}/>
            </Group>}
            {active && !pan && f.points.map((p,i)=>{
              const move=(next:Point):Point=>{const dx=next[0]-p[0],dy=next[1]-p[1];return p.length===6?[next[0],next[1],p[2]!+dx,p[3]!+dy,p[4]!+dx,p[5]!+dy]:next;};
              return <Circle key={i} x={p[0]} y={p[1]} radius={(selectedVertex===i?8:6)/scale} hitStrokeWidth={16/scale} fill={selectedVertex===i?'#111':'#fff'} stroke={color} strokeWidth={2/scale} draggable={!drawing}
                onClick={e=>{if(!drawing){e.cancelBubble=true;onVertexSelect(i);}}} onTap={e=>{if(!drawing){e.cancelBubble=true;onVertexSelect(i);}}}
                onDragStart={()=>onVertexSelect(i)} onDragMove={e=>{const next=bound([e.target.x(),e.target.y()]);e.target.position({x:next[0],y:next[1]});onVertex(i,move(next));}} />;
            })}
            {active&&!drawing&&!pan&&selectedVertex!==null&&f.geometryKind!=='point'&&f.points[selectedVertex]&&(['in','out'] as HandleSide[]).map(side=>{
              const anchor=f.points[selectedVertex], incoming=side==='in', x=anchor[incoming?2:4]??anchor[0]+(incoming?-40:40), y=anchor[incoming?3:5]??anchor[1];
              return <Group key={side}><Line points={[anchor[0],anchor[1],x,y]} stroke="#53615c" strokeWidth={1/scale} dash={[4/scale,4/scale]} listening={false}/><Circle x={x} y={y} radius={5/scale} fill="#fff" stroke="#111" strokeWidth={1.5/scale} draggable onDragMove={e=>{const next=bound([e.target.x(),e.target.y()]);e.target.position({x:next[0],y:next[1]});onHandle(selectedVertex,side,next);}} /></Group>;
            })}
          </Group>;})}
        </Group></Layer>
      </Stage>
    </div>{failed?<p role="alert">რუკის ფოტო ვერ ჩაიტვირთა / Map image could not load. Upload a base map.</p>:!image?<p role="status">რუკა იტვირთება / Loading map…</p>:null}
    <p className="muted">დააწკაპუნეთ წერტილისთვის; დააწკაპუნეთ და გადაათრიეთ მრუდის სახელურებისთვის. ორმაგი დაწკაპუნება ხაზზე ამატებს კვანძს. / Click for a straight anchor; click-drag creates Bézier handles. Double-click a path to insert an anchor.</p>
  </div>;
}
