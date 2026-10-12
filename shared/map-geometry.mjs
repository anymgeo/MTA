// All geometry is in original image pixels. Handles are absolute, independent coordinates.
export const MAP_COLORS = { easy:'#168354', medium:'#246ac1', difficult:'#d73b32', lift:'#171717', warning:'#c27816' };
export const controls = (a,b) => [[a[0],a[1]],[a[4]??a[0],a[5]??a[1]],[b[2]??b[0],b[3]??b[1]],[b[0],b[1]]];
const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
export function cubicAt(a,b,t) { const c=controls(a,b), p=c.slice(0,3).map((v,i)=>lerp(v,c[i+1],t)); return lerp(lerp(p[0],p[1],t),lerp(p[1],p[2],t),t); }
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
  const list=[];for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)list.push({key:`${level}/${col}_${row}`,url:`${tiles.baseUrl}/${level}/${col}_${row}.jpg`,x:col*size,y:row*size,width:Math.min(size,tiles.width-col*size),height:Math.min(size,tiles.height-row*size)});return list;
}
