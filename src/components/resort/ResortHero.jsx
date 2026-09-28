"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSiteSeason } from "@/providers/SeasonProvider";
import { Link } from "@/i18n/navigation";
import ResortIdentity from "./ResortIdentity";
import { allowResortVideo } from "@/models/resort-media";
export default function ResortHero({ resort }) {
  const t = useTranslations("ResortPage"), { season } = useSiteSeason();
  const video = useRef(null), [play, setPlay] = useState(true), [failed, setFailed] = useState(false);
  const [allowed, setAllowed] = useState(false), [ready, setReady] = useState(false);
  const image = resort.page?.posterUrl || resort.seasons?.[season]?.image || resort.image, url = resort.page?.videoUrl;
  const webm = resort.page?.videoWebmUrl;
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 767px)"), connection = navigator.connection;
    const update = () => setAllowed(allowResortVideo({ mobile: mobile.matches, reducedMotion: preference.matches, saveData: connection?.saveData }));
    update(); preference.addEventListener("change", update); mobile.addEventListener("change", update); connection?.addEventListener?.("change", update);
    return () => { preference.removeEventListener("change", update); mobile.removeEventListener("change", update); connection?.removeEventListener?.("change", update); };
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = true;
    const update = () => { if (!play || !visible || document.hidden) element.pause(); else element.play().catch(() => setPlay(false)); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element); document.addEventListener("visibilitychange", update); update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); element.pause(); };
  }, [play, url, webm, allowed, failed]);
  return <section className="rp-hero">
    <img src={image} alt="" fetchPriority="high" />
    {allowed && (url || webm) && !failed && <video key={url + webm} ref={video} poster={image} muted autoPlay loop playsInline preload="metadata" style={{ opacity: ready ? 1 : 0 }} onLoadedData={() => setReady(true)} onError={event => { if (event.target === event.currentTarget) setFailed(true); }} aria-hidden="true">
      {webm && <source src={webm} type="video/webm" onError={() => { if (!url) setFailed(true); }} />}
      {url && <source src={url} type={url.split("?")[0].endsWith(".webm") ? "video/webm" : "video/mp4"} onError={() => setFailed(true)} />}
    </video>}
    <div className="rp-wrap">
      <div className="rp-hero-tools"><Link href="/resorts">← {t("allResorts")}</Link>
        {allowed && (url || webm) && !failed && <button type="button" onClick={() => setPlay(p => !p)}>{t(play ? "pauseVideo" : "playVideo")}</button>}
      </div>
      <div className="mt-12"><ResortIdentity resort={resort} /></div>
      <h1>{resort.name}</h1><p>{resort.description}</p>
    </div>
  </section>;
}
