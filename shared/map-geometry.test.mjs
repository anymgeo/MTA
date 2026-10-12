import {test} from 'node:test';import assert from 'node:assert/strict';
import {splitSegment,cubicAt,closestOnPath,moveHandle,moveAnchor,visibleTiles,liftTicks,liftTickPath,LIFT_STYLE,alignPoint,defaultAlignment,pathFractionAt,pointOnPath,cutLabelLayout,liftStyleForMap} from './map-geometry.mjs';
test('De Casteljau insertion retains the original cubic, including closing segments',()=>{
 const points=[[10,20,-20,50,350,-400],[900,700,550,1100,1000,800]],t=.371,split=splitSegment(points,0,t);
 for(let i=0;i<=100;i++){const u=i/100,expected=cubicAt(...points,u),actual=u<t?cubicAt(split[0],split[1],u/t):cubicAt(split[1],split[2],(u-t)/(1-t));assert(Math.hypot(expected[0]-actual[0],expected[1]-actual[1])<1e-9);}
 const closed=splitSegment(points,1,t);for(let i=0;i<=100;i++){const u=i/100,expected=cubicAt(points[1],points[0],u),actual=u<t?cubicAt(closed[1],closed[2],u/t):cubicAt(closed[2],closed[0],(u-t)/(1-t));assert(Math.hypot(expected[0]-actual[0],expected[1]-actual[1])<1e-9);}
});
test('hit testing locates a highly curved segment at sub-pixel precision',()=>{const points=[[0,0,0,0,3000,9000],[8000,6000,-5000,-3000,8000,6000]],p=cubicAt(...points,.63912),hit=closestOnPath(points,p,false,.1);assert(hit.distance<.01);assert(Math.abs(hit.t-.63912)<1e-5);});
test('independent corner handle leaves its opposite untouched; anchor moves both handles',()=>{const p=[100,100,50,80,150,120];assert.deepEqual(moveHandle(p,'out',[170,180],false),[100,100,50,80,170,180]);assert.deepEqual(moveAnchor(p,[120,150]),[120,150,70,130,170,170]);const moved=moveHandle(p,'out',[100,200],true);assert.equal(moved[2],100);assert.equal(moved[4],100);assert(Math.abs(Math.hypot(moved[2]-100,moved[3]-100)-Math.hypot(50,20))<1e-9);});
test('large imagery loads viewport tiles only at an appropriate pyramid level',()=>{const m={width:8192,height:7181,tileSize:512,maxLevel:13,baseUrl:'/media/map_files'},fit=visibleTiles(m,.1,0,0,900,800),zoom=visibleTiles(m,4,-12000,-9000,900,800);assert(fit.length<=9);assert(zoom.length<=4);assert(zoom.every(t=>t.url.includes('/13/')));});
test('lift ticks have constant arc spacing and are perpendicular to the exact cubic',()=>{
 const points=[[0,0,0,0,800,1500],[1200,900,300,-400,1600,700],[2000,600,1800,300,2000,600]],ticks=liftTicks(points);
 assert(ticks.length>50);
 for(const [i,tick] of ticks.entries()){
  if(i)assert(Math.abs(tick.distance-ticks[i-1].distance-LIFT_STYLE.spacing)<1e-9);
  const p=cubicAt(points[tick.index],points[tick.index+1],tick.t);assert(Math.hypot(p[0]-tick.center[0],p[1]-tick.center[1])<1e-9);
  const before=cubicAt(points[tick.index],points[tick.index+1],tick.t-1e-5),after=cubicAt(points[tick.index],points[tick.index+1],tick.t+1e-5),dx=tick.to[0]-tick.from[0],dy=tick.to[1]-tick.from[1];
  assert(Math.abs(Math.hypot(dx,dy)-LIFT_STYLE.tickLength)<1e-8);assert(Math.abs(dx*(after[0]-before[0])+dy*(after[1]-before[1]))<1e-6);
 }
 const split=liftTicks(splitSegment(points,0,.41));assert.equal(split.length,ticks.length);ticks.forEach((t,i)=>assert(Math.hypot(t.center[0]-split[i].center[0],t.center[1]-split[i].center[1])<.08));
 assert.notEqual(liftTickPath(points),liftTickPath([points[0],[1400,950,500,20,1600,700],points[2]]));
});
test('lift tick spacing is uniform over straight paths and robust to zero-length anchors',()=>{
 const ticks=liftTicks([[0,0],[0,0],[280,0]]);assert.equal(ticks.length,10);ticks.forEach((t,i)=>{assert(Math.abs(t.center[0]-(14+i*28))<.08);assert.equal(t.from[0],t.to[0]);});
 assert.equal(liftTicks([[0,0],[0,0]]).length,0);assert.equal(liftTicks([[0,0]]).length,0);assert.equal(liftTicks([[0,0],[280,0]],{...LIFT_STYLE,spacing:56}).length,5);
});
test('image alignment transforms anchors and both handles without changing the cubic shape',()=>{
 const points=[[100,200,50,120,200,500],[800,900,650,450,900,1000]],alignment={scaleX:4.1,scaleY:3.8,rotation:12,offsetX:40,offsetY:-30},next=points.map(p=>alignPoint(p,alignment));
 for(let i=0;i<=100;i++){const t=i/100,p=alignPoint(cubicAt(...points,t),alignment),q=cubicAt(...next,t);assert(Math.hypot(p[0]-q[0],p[1]-q[1])<1e-9);}
 const fit=defaultAlignment({width:1961,height:1455},{width:8192,height:7181});assert.equal(fit.scaleX,fit.scaleY);assert(fit.offsetY>0);assert.equal(fit.offsetX,0);
 const scaled=defaultAlignment({width:1961,height:1455},{width:3922,height:2910});assert.equal(scaled.scaleX,2);assert.equal(scaled.scaleY,2);
});
test('cut labels remain on the exact curve and regenerate their angle after editing',()=>{
 const points=[[0,0,0,0,200,900],[1000,700,700,-100,1000,700]],fraction=pathFractionAt(points,0,.4),position=pointOnPath(points,fraction),expected=cubicAt(...points,.4);
 assert(Math.hypot(position.point[0]-expected[0],position.point[1]-expected[1])<.01);
 const label={cutLine:true,pathPosition:fraction,gap:24},map={width:1600,height:1000},first=cutLabelLayout(points,label,map,1,'Yaila 2'),next=cutLabelLayout([points[0],[1000,900,700,700,1000,900]],label,map,1,'Yaila 2');assert.notEqual(first.angle,next.angle);assert(first.width>70);assert(cutLabelLayout(points,label,map,1,'').width>0);assert.equal(cutLabelLayout(points,{cutLine:false},map,1,'Name'),null);
 const scaled=points.map(p=>alignPoint(p,{scaleX:4,scaleY:4,rotation:0,offsetX:0,offsetY:0})),ticks=liftTicks(points,liftStyleForMap(map)),largeTicks=liftTicks(scaled,liftStyleForMap({width:6400,height:4000}));assert.equal(ticks.length,largeTicks.length);
 const alignment={scaleX:3.2,scaleY:1.1,rotation:18,offsetX:80,offsetY:50},native=alignPoint(position.point,alignment),changed=points.map(p=>alignPoint(p,alignment)),reprojected=cutLabelLayout(changed,{...label,pathPosition:null,x:native[0],y:native[1]},map,1,'Yaila 2');assert(Math.hypot(reprojected.x-native[0],reprojected.y-native[1])<.02);
});
