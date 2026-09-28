"use client";
import { useEffect, useRef } from "react";
export default function ResortMotion() {
  const progress = useRef(null);
  useEffect(() => {
    const progressElement = progress.current;
    const root = progressElement?.closest("main");
    if (!root) return;
    let disposed = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = matchMedia("(min-width: 768px)");
    const items = [...root.querySelectorAll(".rp-section, .rp-stats > div, .rp-activities li, .rp-tables tbody tr, .rp-mountain-accent")];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("rp-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.06 });
    items.forEach((item, i) => {
      if (item.getBoundingClientRect().top > innerHeight) {
        item.classList.add("rp-reveal"); item.style.setProperty("--rp-delay", `${i % 4 * 55}ms`); observer.observe(item);
      }
    });
    const hero = root.querySelector(".rp-hero"); let frame = 0, total = 1, heroHeight = 1;
    const draw = () => {
      frame = 0;
      if (disposed) return;
      progressElement.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / total))})`;
      const amount = reduced.matches || !desktop.matches ? 0 : Math.min(1, scrollY / heroHeight);
      hero?.style.setProperty("--rp-hero-shift", `${amount * 40}px`);
      hero?.style.setProperty("--rp-hero-scale", `${1.04 - amount * .04}`);
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(draw); };
    const measure = () => { if (disposed) return; total = Math.max(1, root.offsetHeight - innerHeight); heroHeight = hero?.offsetHeight || 1; schedule(); };
    const resize = new ResizeObserver(measure); resize.observe(root); if (hero) resize.observe(hero);
    const revealFocus = event => { event.target.closest?.(".rp-reveal")?.classList.add("rp-visible"); };
    root.addEventListener("focusin", revealFocus);
    addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", measure); reduced.addEventListener("change", schedule); measure();
    return () => {
      disposed = true;
      observer.disconnect(); resize.disconnect(); cancelAnimationFrame(frame); root.removeEventListener("focusin", revealFocus);
      removeEventListener("scroll", schedule); removeEventListener("resize", measure); reduced.removeEventListener("change", schedule);
      items.forEach(item => item.classList.remove("rp-reveal", "rp-visible"));
    };
  }, []);
  return <div ref={progress} className="rp-progress" aria-hidden="true" />;
}
