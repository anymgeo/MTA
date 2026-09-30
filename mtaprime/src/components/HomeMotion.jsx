"use client";

import { useEffect, useRef } from "react";

const CARD_SELECTOR = [
  ".news-card",
  ".resort-brand-card",
  ".live-resort-card",
  ".camera-card",
  ".home-motion-card",
].join(",");

export default function HomeMotion() {
  const marker = useRef(null);

  useEffect(() => {
    const root = marker.current?.closest("main");
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const sections = [...root.querySelectorAll(":scope > section")];
    const observed = [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    sections.forEach((section, sectionIndex) => {
      section.classList.add("home-step");
      if (sectionIndex === 0) section.classList.add("is-visible");
      else observed.push(section);
      const headingGroup = section.querySelector("h1, h2")?.parentElement;
      if (headingGroup && sectionIndex > 0) {
        headingGroup.classList.add("home-reveal");
        headingGroup.style.setProperty("--home-delay", "0ms");
        observed.push(headingGroup);
      }
      section.querySelectorAll(CARD_SELECTOR).forEach((card, index) => {
        card.classList.add("home-stagger-item");
        card.style.setProperty("--home-delay", `${Math.min(index, 7) * 70}ms`);
        observed.push(card);
      });
    });
    observed.forEach((element) => observer.observe(element));

    const hero = root.querySelector("[data-home-hero-media]");
    let frame = 0;
    let disposed = false;
    const draw = () => {
      frame = 0;
      if (disposed || !hero) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
      const active = !reducedMotion.matches && desktop.matches;
      hero.style.setProperty("--home-hero-y", `${active ? progress * 52 : 0}px`);
      hero.style.setProperty("--home-hero-scale", `${active ? 1.055 - progress * 0.055 : 1}`);
      hero.style.setProperty("--home-hero-opacity", `${active ? 1 - progress * 0.16 : 1}`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const revealFocused = (event) => event.target.closest?.(".home-reveal,.home-stagger-item")?.classList.add("is-visible");
    root.addEventListener("focusin", revealFocused);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    desktop.addEventListener("change", schedule);
    draw();

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      root.removeEventListener("focusin", revealFocused);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      desktop.removeEventListener("change", schedule);
      sections.forEach((section) => section.classList.remove("home-step", "is-visible"));
      observed.forEach((element) => {
        element.classList.remove("home-reveal", "home-stagger-item", "is-visible");
        element.style.removeProperty("--home-delay");
      });
    };
  }, []);

  return <span ref={marker} hidden aria-hidden="true" />;
}
