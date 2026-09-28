"use client";
import { useEffect, useRef } from "react";
/** Separate short canvas: hero snowfall remains unchanged. Capped at 90 particles, 30fps. */
export default function HeaderSnow() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas.getContext("2d");
    if (!ctx) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0,
      w = 0,
      h = 0,
      flakes = [],
      color = "";
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      color = getComputedStyle(canvas).color;
      flakes = Array.from(
        { length: Math.min(90, Math.max(34, Math.floor(w / 14))) },
        (_, i) => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 3,
          speed: 16 + Math.random() * 35,
          alpha: 0.3 + Math.random() * 0.55,
          phase: Math.random() * 6.28,
          crystal: i % 7 === 0,
        }),
      );
    };
    const draw = (time) => {
      frame = requestAnimationFrame(draw);
      if (time - last < 32) return;
      const dt = last ? Math.min((time - last) / 1000, 0.06) : 0;
      last = time;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      for (const f of flakes) {
        f.y = (f.y + f.speed * dt) % (h || 1);
        f.x =
          (f.x + (10 + Math.sin(time / 1100 + f.phase) * 15) * dt + w) %
          (w || 1);
        ctx.globalAlpha = f.alpha;
        if (f.crystal) {
          ctx.lineWidth = 0.8;
          for (let a = 0; a < 3; a++) {
            const angle = (a * Math.PI) / 3,
              dx = Math.cos(angle) * f.r * 1.8,
              dy = Math.sin(angle) * f.r * 1.8;
            ctx.beginPath();
            ctx.moveTo(f.x - dx, f.y - dy);
            ctx.lineTo(f.x + dx, f.y + dy);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const update = () => {
      cancelAnimationFrame(frame);
      last = 0;
      ctx.clearRect(0, 0, w, h);
      if (!document.hidden && !media.matches)
        frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(() => {
      resize();
      update();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", update);
    media.addEventListener("change", update);
    resize();
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      media.removeEventListener("change", update);
    };
  }, []);
  return <canvas className="header-snow" ref={ref} aria-hidden="true" />;
}
