// All geometry is in original image pixels. Handles are absolute, independent coordinates.
export const MAP_COLORS = { easy:'#168354', medium:'#246ac1', difficult:'#d73b32', lift:'#171717', warning:'#c27816' };
export const controls = (a,b) => [[a[0],a[1]],[a[4]??a[0],a[5]??a[1]],[b[2]??b[0],b[3]??b[1]],[b[0],b[1]]];
const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
export function cubicAt(a,b,t) { const c=controls(a,b), p=c.slice(0,3).map((v,i)=>lerp(v,c[i+1],t)); return lerp(lerp(p[0],p[1],t),lerp(p[1],p[2],t),t); }
// One global lift symbol. Native tick dimensions scale with the image's long side,
// keeping the symbol legible when the same map is replaced by a high-resolution source.
export const LIFT_STYLE = Object.freeze({ spacing:28, tickLength:14, strokeWidth:2.5, tickStrokeWidth:1.8 });
export function liftStyleForMap(map) {const factor=Math.max(map.width,map.height)/1600;return {...LIFT_STYLE,spacing:LIFT_STYLE.spacing*factor,tickLength:LIFT_STYLE.tickLength*factor};}
export function liftTicks(points=[], style=LIFT_STYLE) {
  const {spacing,tickLength}=style;
  if (!(spacing>0) || !(tickLength>0) || points.length<2) return [];
  const edges=[]; let length=0;
  // Arc-length lookup: adaptive De Casteljau subdivision also handles loops/cusps.
  function flatten(q,index,lo,hi,depth) {
    const chord=Math.hypot(q[3][0]-q[0][0],q[3][1]-q[0][1]);
    const polygon=q.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-q[i][0],p[1]-q[i][1]),0);
    if(depth>=20||(polygon-chord<.002 && chord<=spacing/4)) {
      if(chord>1e-10){edges.push({index,lo,hi,start:length,end:length+chord});length+=chord;}return;
    }
    const a=lerp(q[0],q[1],.5),b=lerp(q[1],q[2],.5),c=lerp(q[2],q[3],.5),d=lerp(a,b,.5),e=lerp(b,c,.5),m=lerp(d,e,.5),mid=(lo+hi)/2;
    flatten([q[0],a,d,m],index,lo,mid,depth+1);flatten([m,e,c,q[3]],index,mid,hi,depth+1);
  }
  for(let i=0;i<points.length-1;i++)flatten(controls(points[i],points[i+1]),i,0,1,0);
  if(length<1e-8)return [];
  const count=Math.max(1,Math.floor(length/spacing)),offset=(length-(count-1)*spacing)/2,ticks=[];
  let cursor=0;
  for(let i=0;i<count;i++){
    const distance=offset+i*spacing;
    while(cursor<edges.length-1&&edges[cursor].end<distance)cursor++;
    const edge=edges[cursor],a=points[edge.index],b=points[edge.index+1],origin=cubicAt(a,b,edge.lo);
    // Straight cubics can have non-linear parameter speed; invert local distance, not t.
    let lo=edge.lo,hi=edge.hi;for(let j=0;j<22;j++){const mid=(lo+hi)/2,p=cubicAt(a,b,mid);if(Math.hypot(p[0]-origin[0],p[1]-origin[1])<distance-edge.start)lo=mid;else hi=mid;}
    const t=(lo+hi)/2,q=controls(a,b),u=1-t;
    const center=cubicAt(a,b,t);
    let dx=3*u*u*(q[1][0]-q[0][0])+6*u*t*(q[2][0]-q[1][0])+3*t*t*(q[3][0]-q[2][0]);
    let dy=3*u*u*(q[1][1]-q[0][1])+6*u*t*(q[2][1]-q[1][1])+3*t*t*(q[3][1]-q[2][1]);
    if(Math.hypot(dx,dy)<1e-9){const p=cubicAt(a,b,edge.lo),n=cubicAt(a,b,edge.hi);dx=n[0]-p[0];dy=n[1]-p[1];}
    const norm=Math.hypot(dx,dy);if(!norm)continue;
    const nx=-dy/norm*tickLength/2,ny=dx/norm*tickLength/2;
    ticks.push({from:[center[0]-nx,center[1]-ny],to:[center[0]+nx,center[1]+ny],center,distance,index:edge.index,t});
  }
  return ticks;
}
export function liftTickPath(points=[],style=LIFT_STYLE){
  const format=p=>p.map(v=>Number(v.toFixed(5))).join(' ');
  return liftTicks(points,style).map(tick=>`M ${format(tick.from)} L ${format(tick.to)}`).join(' ');
}
// The same affine operation applies to anchors, both absolute handles and labels.
export function alignPoint(point,{scaleX,scaleY,rotation,offsetX,offsetY}) {
  const r=rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),result=[];
  for(let i=0;i<point.length;i+=2){const x=(point[i]??point[0])*scaleX,y=(point[i+1]??point[1])*scaleY;result.push(x*c-y*s+offsetX,x*s+y*c+offsetY);}return result;
}
export function defaultAlignment(oldSize,newSize,proportional=false) {
  const sx=newSize.width/oldSize.width,sy=newSize.height/oldSize.height;
  const sameAspect=Math.abs(sx/sy-1)<.005,scale=Math.min(sx,sy);
  const scaleX=sameAspect||proportional?sx:scale,scaleY=sameAspect||proportional?sy:scale;
  return {scaleX,scaleY,rotation:0,offsetX:(newSize.width-oldSize.width*scaleX)/2,offsetY:(newSize.height-oldSize.height*scaleY)/2};
}
function pathMeasure(points) {
  const edges=[];let length=0;
  function flatten(q,index,lo,hi,depth){
    const chord=Math.hypot(q[3][0]-q[0][0],q[3][1]-q[0][1]),polygon=q.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-q[i][0],p[1]-q[i][1]),0);
    if(depth>=20||(polygon-chord<.002&&chord<16)){if(chord>1e-10){edges.push({index,lo,hi,start:length,end:length+chord});length+=chord;}return;}
    const a=lerp(q[0],q[1],.5),b=lerp(q[1],q[2],.5),c=lerp(q[2],q[3],.5),d=lerp(a,b,.5),e=lerp(b,c,.5),m=lerp(d,e,.5),mid=(lo+hi)/2;
    flatten([q[0],a,d,m],index,lo,mid,depth+1);flatten([m,e,c,q[3]],index,mid,hi,depth+1);
  }
  for(let i=0;i<points.length-1;i++)flatten(controls(points[i],points[i+1]),i,0,1,0);
  return {edges,length};
}
export function pathFractionAt(points,index,t) {
  const {edges,length}=pathMeasure(points),edge=edges.find(e=>e.index===index&&e.hi>=t);if(!edge||!length)return 0;
  const p=cubicAt(points[index],points[index+1],t),start=cubicAt(points[index],points[index+1],edge.lo);
  return Math.max(0,Math.min(1,(edge.start+Math.hypot(p[0]-start[0],p[1]-start[1]))/length));
}
export function pointOnPath(points,position=.5) {
  const {edges,length}=pathMeasure(points);if(!length)return {point:points[0]?.slice(0,2)||[0,0],angle:0,length:0};
  const distance=Math.max(0,Math.min(1,position))*length,edge=edges.find(e=>e.end>=distance)||edges.at(-1),a=points[edge.index],b=points[edge.index+1],origin=cubicAt(a,b,edge.lo);
  let lo=edge.lo,hi=edge.hi;for(let j=0;j<22;j++){const m=(lo+hi)/2,p=cubicAt(a,b,m);if(Math.hypot(p[0]-origin[0],p[1]-origin[1])<distance-edge.start)lo=m;else hi=m;}
  const t=(lo+hi)/2,q=controls(a,b),u=1-t,dx=3*u*u*(q[1][0]-q[0][0])+6*u*t*(q[2][0]-q[1][0])+3*t*t*(q[3][0]-q[2][0]),dy=3*u*u*(q[1][1]-q[0][1])+6*u*t*(q[2][1]-q[1][1])+3*t*t*(q[3][1]-q[2][1]);
  let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;
  return {point:cubicAt(a,b,t),angle,length};
}
export function cutLabelLayout(points,label,map,scale,text) {
  if(!label?.cutLine||points.length<2)return null;
  let position=label.pathPosition;
  // After image alignment, re-project the transformed native label point. Anisotropic
  // scaling changes arc fractions, but must not move the name to another geographic point.
  if(position==null&&Number.isFinite(label.x)&&Number.isFinite(label.y)){const hit=closestOnPath(points,[label.x,label.y]);position=pathFractionAt(points,hit.index,hit.t);}
  const {point,angle,length}=pointOnPath(points,position??.5),maxGap=length*.65;
  // A short feature must not disappear entirely behind its name; zoom reveals more detail.
  const fontScreen=Math.max(8,Math.min(15,(maxGap*scale-12)/Math.max(1,text.length*.6))),fontSize=fontScreen/scale;
  return {x:Number(point[0].toFixed(8)),y:Number(point[1].toFixed(8)),angle:Number(angle.toFixed(8)),fontSize,width:Math.min(maxGap,Math.max((label.gap??24)*Math.max(map.width,map.height)/1600,(text.length*fontScreen*.6+12)/scale)),height:(fontScreen+10)/scale};
}
export function pathData(points=[],closed=false) {
  if (!points.length) return '';
  let d=`M ${points[0][0]} ${points[0][1]}`;
  const n=closed?points.length:points.length-1;
  for(let i=0;i<n;i++){const c=controls(points[i],points[(i+1)%points.length]);d+=` C ${c[1].join(' ')} ${c[2].join(' ')} ${c[3].join(' ')}`;}
  return d+(closed?' Z':'');
}
export function splitSegment(points,index,t) {
  const result=points.map(p=>[...p]), next=(index+1)%points.length, c=controls(points[index],points[next]);
  const a=lerp(c[0],c[1],t),b=lerp(c[1],c[2],t),d=lerp(c[2],c[3],t),e=lerp(a,b,t),f=lerp(b,d,t),p=lerp(e,f,t);
  result[index]=[...c[0],points[index][2]??c[0][0],points[index][3]??c[0][1],...a];
  result[next]=[...c[3],...d,points[next][4]??c[3][0],points[next][5]??c[3][1]];
  result.splice(index+1,0,[...p,...e,...f]);
  return result;
}
// Adaptive flattening bounds hit-test error in screen pixels, then refines on the cubic itself.
export function closestOnPath(points,target,closed=false,tolerance=.25) {
  let best={index:0,t:0,distance:Infinity,point:[0,0]};
  const dist=p=>(p[0]-target[0])**2+(p[1]-target[1])**2;
  for(let index=0;index<(closed?points.length:points.length-1);index++){
    const a=points[index],b=points[(index+1)%points.length],c=controls(a,b); const leaves=[];
    function flatten(q,lo,hi,depth){
      const dx=q[3][0]-q[0][0],dy=q[3][1]-q[0][1],length=Math.hypot(dx,dy);
      const deviation=Math.max(...q.slice(1,3).map(p=>length?Math.abs(dy*(p[0]-q[0][0])-dx*(p[1]-q[0][1]))/length:Math.hypot(p[0]-q[0][0],p[1]-q[0][1])));
      const polygon=q.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-q[i][0],p[1]-q[i][1]),0);
      if(depth>=18||(deviation<=tolerance && polygon-length<=tolerance)){leaves.push([lo,hi]);return;}
      const x=lerp(q[0],q[1],.5),y=lerp(q[1],q[2],.5),z=lerp(q[2],q[3],.5),u=lerp(x,y,.5),v=lerp(y,z,.5),m=lerp(u,v,.5),mid=(lo+hi)/2;
      flatten([q[0],x,u,m],lo,mid,depth+1);flatten([m,v,z,q[3]],mid,hi,depth+1);
    }
    flatten(c,0,1,0);
    for(const range of leaves){let lo=range[0],hi=range[1];for(let j=0;j<24;j++){const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3;if(dist(cubicAt(a,b,l))<dist(cubicAt(a,b,r)))hi=r;else lo=l;}
      for(const t of [range[0],(lo+hi)/2,range[1]]){const point=cubicAt(a,b,t),distance=Math.sqrt(dist(point));if(distance<best.distance)best={index,t,distance,point};}
    }
  }
  return best;
}
export function moveAnchor(p,next){const dx=next[0]-p[0],dy=next[1]-p[1];return p.length===6?[next[0],next[1],p[2]+dx,p[3]+dy,p[4]+dx,p[5]+dy]:[...next];}
export function moveHandle(p,side,next,smooth=false){const c=[p[0],p[1],p[2]??p[0],p[3]??p[1],p[4]??p[0],p[5]??p[1]],i=side==='in'?2:4,j=i===2?4:2;c[i]=next[0];c[i+1]=next[1];if(smooth){const len=Math.hypot(c[j]-c[0],c[j+1]-c[1]),dx=next[0]-c[0],dy=next[1]-c[1],n=Math.hypot(dx,dy);if(n){c[j]=c[0]-dx/n*len;c[j+1]=c[1]-dy/n*len;}}return c;}
export function visibleTiles(tiles,scale,x,y,width,height){
  const level=Math.max(0,Math.min(tiles.maxLevel,tiles.maxLevel+Math.ceil(Math.log2(Math.max(scale,.00001))))),factor=2**(tiles.maxLevel-level),size=tiles.tileSize*factor;
  const left=Math.max(0,Math.floor(-x/scale/size)),top=Math.max(0,Math.floor(-y/scale/size)),right=Math.min(Math.ceil(tiles.width/size)-1,Math.floor((width-x)/scale/size)),bottom=Math.min(Math.ceil(tiles.height/size)-1,Math.floor((height-y)/scale/size));
  const list=[];for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)list.push({key:`${level}/${col}_${row}`,url:`${tiles.baseUrl}/${level}/${col}_${row}.${tiles.extension||'jpg'}`,x:col*size,y:row*size,width:Math.min(size,tiles.width-col*size),height:Math.min(size,tiles.height-row*size)});return list;
}
