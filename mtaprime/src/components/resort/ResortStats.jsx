"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
function Count({ value, animate }) {
  const ref = useRef(null), [display, setDisplay] = useState(value);
  useEffect(() => {
    const match = String(value || "").match(/^(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!animate || !match || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(match[1].replaceAll(",", ""));
    if (!Number.isFinite(target)) return;
    const decimals = match[1].split(".")[1]?.length || 0;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect(); const start = performance.now();
      const tick = now => {
        const progress = Math.min(1, (now - start) / 900);
        const number = (target * (1 - Math.pow(1 - progress, 3))).toFixed(decimals);
        setDisplay(progress === 1 ? value : number + match[2]);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: .5 });
    observer.observe(ref.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, animate]);
  return <span ref={ref} aria-label={String(value || "—")}><span aria-hidden="true">{display || "—"}</span></span>;
}
export default function ResortStats({ resort }) {
  const t = useTranslations("ResortPage");
  const total = value => value?.includes("/") ? value.split("/").at(-1).trim() : value;
  const stats = [["skiArea",resort.pistes],["lifts",total(resort.lifts)],["trails",total(resort.trails)],["season",resort.winterSeason],["hours",resort.hours],["altitude",resort.highestPoint]];
  return <dl className="rp-stats rp-wrap">{stats.map(([key,value]) => <div key={key}><dt>{t(key)}</dt><dd><Count value={value} animate={!["season","hours"].includes(key)} /></dd></div>)}</dl>;
}
