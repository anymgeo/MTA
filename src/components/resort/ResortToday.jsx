"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { observationState } from "@/models/live-conditions";
import { useSiteSeason } from "@/providers/SeasonProvider";
import ResortCard from "@/components/ResortCard";
import { Link } from "@/i18n/navigation";
export default function ResortToday({ resort }) {
  const t = useTranslations("ResortPage"), liveT = useTranslations("LiveCards");
  const { season } = useSiteSeason();
  const [data, setData] = useState(null), [now, setNow] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/resort-conditions", { cache: "no-store", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(12000)]) });
        const rows = response.ok ? await response.json() : [];
        if (active) setData(Array.isArray(rows) ? rows.find(r => String(r.resortId) === String(resort.id)) || null : null);
      } catch { if (active) setData(null); }
      finally { if (active) setNow(Date.now()); }
    }
    void refresh(); const timer = setInterval(refresh, 60000), clock = setInterval(() => setNow(Date.now()), 15000);
    return () => { active = false; abort.abort(); clearInterval(timer); clearInterval(clock); };
  }, [resort.id]);
  const state = observationState(data, now);
  return <section id="today" className="rp-section live-mountains-section">
    <div className="rp-wrap rp-live-layout"><div>
      <span className="rp-kicker">{resort.region}</span><h2>{t("today", { resort: resort.name })}</h2>
      <p role="status">{state.unavailable ? t("livePlaceholder") : state.stale ? liveT("stale") : liveT("minutesAgo", { count: state.minutes })}</p>
      <Link className="rp-button mt-6" href={`/resorts/${resort.slug}/maps`}>{t("interactiveMap")} ↗</Link>
      <svg className="rp-mountain-accent" viewBox="0 0 600 180" aria-hidden="true"><path d="M0 175 130 45 205 114 325 8 445 124 508 68 600 175Z" fill="currentColor" /><path d="m265 63 60-55 67 66-45-20-22 15-25-23Z" fill="white" /></svg>
    </div><ResortCard resort={resort} conditions={data} season={season} now={now} detailsHref={`/resorts/${resort.slug}/maps`} detailsLabel={t("interactiveMap")} /></div>
  </section>;
}
