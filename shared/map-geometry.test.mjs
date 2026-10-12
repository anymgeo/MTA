import {test} from 'node:test';import assert from 'node:assert/strict';
import {splitSegment,cubicAt,closestOnPath,moveHandle,moveAnchor,visibleTiles} from './map-geometry.mjs';
test('De Casteljau insertion retains the original cubic, including closing segments',()=>{
 const points=[[10,20,-20,50,350,-400],[900,700,550,1100,1000,800]],t=.371,split=splitSegment(points,0,t);
 for(let i=0;i<=100;i++){const u=i/100,expected=cubicAt(...points,u),actual=u<t?cubicAt(split[0],split[1],u/t):cubicAt(split[1],split[2],(u-t)/(1-t));assert(Math.hypot(expected[0]-actual[0],expected[1]-actual[1])<1e-9);}
 const closed=splitSegment(points,1,t);for(let i=0;i<=100;i++){const u=i/100,expected=cubicAt(points[1],points[0],u),actual=u<t?cubicAt(closed[1],closed[2],u/t):cubicAt(closed[2],closed[0],(u-t)/(1-t));assert(Math.hypot(expected[0]-actual[0],expected[1]-actual[1])<1e-9);}
});
test('hit testing locates a highly curved segment at sub-pixel precision',()=>{const points=[[0,0,0,0,3000,9000],[8000,6000,-5000,-3000,8000,6000]],p=cubicAt(...points,.63912),hit=closestOnPath(points,p,false,.1);assert(hit.distance<.01);assert(Math.abs(hit.t-.63912)<1e-5);});
test('independent corner handle leaves its opposite untouched; anchor moves both handles',()=>{const p=[100,100,50,80,150,120];assert.deepEqual(moveHandle(p,'out',[170,180],false),[100,100,50,80,170,180]);assert.deepEqual(moveAnchor(p,[120,150]),[120,150,70,130,170,170]);const moved=moveHandle(p,'out',[100,200],true);assert.equal(moved[2],100);assert.equal(moved[4],100);assert(Math.abs(Math.hypot(moved[2]-100,moved[3]-100)-Math.hypot(50,20))<1e-9);});
test('large imagery loads viewport tiles only at an appropriate pyramid level',()=>{const m={width:8192,height:7181,tileSize:512,maxLevel:13,baseUrl:'/media/map_files'},fit=visibleTiles(m,.1,0,0,900,800),zoom=visibleTiles(m,4,-12000,-9000,900,800);assert(fit.length<=9);assert(zoom.length<=4);assert(zoom.every(t=>t.url.includes('/13/')));});
