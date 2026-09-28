"use client";
import { useEffect, useRef } from "react";
/** Decorative snow: capped, DPR-limited and stopped offscreen/when inactive. */
export default function SnowOverlay() {
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current, ctx=canvas.getContext('2d');
  if(!ctx)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=0,width=0,height=0,visible=true,flakes=[];
  const resize=()=>{
   const bounds=canvas.getBoundingClientRect();width=bounds.width;height=bounds.height;
   const dpr=Math.min(window.devicePixelRatio||1,1.5);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   flakes=Array.from({length:Math.min(48,Math.max(16,Math.round(width/25)))},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.6+.6,speed:14+Math.random()*24}));
  };
  const draw=time=>{
   const dt=last?Math.min((time-last)/1000,.05):0;last=time;
   ctx.clearRect(0,0,width,height);ctx.fillStyle=getComputedStyle(canvas).color;
   for(const flake of flakes){flake.y=(flake.y+flake.speed*dt)%(height||1);flake.x=(flake.x+6*dt)%(width||1);ctx.beginPath();ctx.arc(flake.x,flake.y,flake.r,0,Math.PI*2);ctx.fill();}
   frame=requestAnimationFrame(draw);
  };
  const update=()=>{cancelAnimationFrame(frame);last=0;ctx.clearRect(0,0,width,height);if(!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(draw);};
  const ro=new ResizeObserver(()=>{resize();update();});ro.observe(canvas);
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});io.observe(canvas);
  motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);resize();update();
  return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();motion.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
 },[]);
 return <canvas ref={ref} aria-hidden="true" className="snow-overlay"/>;
}
