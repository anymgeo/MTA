"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSiteSeason } from "@/providers/SeasonProvider";
import { ArrowUpRight } from "lucide-react";
import ResortCard from "./ResortCard";
export default function LiveMountainData({
  resorts,
}) {
  const t = useTranslations("LiveMountainData");
  const labels = useTranslations("LiveCards");
  const { season } = useSiteSeason();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/resort-conditions", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
        const data = response.ok ? await response.json() : [];
        if (active) setObservations(Array.isArray(data) ? data.filter(item => item && typeof item === "object") : []);
      } catch { if (active) setObservations([]); }
      finally { if (active) { setLoading(false); setNow(Date.now()); } }
    }
    void refresh();
    const poll = setInterval(refresh, 60000);
    const clock = setInterval(() => setNow(Date.now()), 15000);
    return () => { active = false; controller.abort(); clearInterval(poll); clearInterval(clock); };
  }, []);
  const cards = resorts.filter(r => r.liveCard?.homepageVisible !== false)
    .toSorted((a, b) => (a.liveCard?.displayOrder ?? 100) - (b.liveCard?.displayOrder ?? 100));
  const backdrop = cards[0]?.seasons?.[season]?.image;
  return (
    <section id="live" className="live-mountains-section px-6 py-24 md:px-10 lg:py-28">
      {backdrop && <div aria-hidden="true" className="live-section-backdrop" style={{ backgroundImage: `url("${backdrop}")` }} />}
      <div className="relative mx-auto max-w-[1760px]">
        {/* SECTION HEADER */}
        <div className="mb-14 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-ink">
              {t("liveMountainData_381e70")}
            </p>

            <h2 className="text-5xl font-black leading-[0.9] tracking-tight md:text-6xl lg:text-7xl">
              {t("todayInThe_109796")}
              <br />
              <span className="font-heading font-normal">
                {t("mountains_d17fd6")}
              </span>
            </h2>
          </div>

          <div className="max-w-xl lg:ml-auto">
            <p className="leading-7 text-muted">
              {t("knowBeforeYouGoOfficialConditions_714a09")}
            </p>

            <a href="https://status.mta.ski/en" target="_blank" rel="noreferrer" className="group mt-6 inline-flex items-center gap-3 rounded-xl bg-ink px-6 py-4 text-xs font-bold tracking-[0.1em] text-white transition-opacity hover:opacity-80">
              {t("viewFullReport_39e74d")}
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>

        {/* RESORT CARDS */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-busy={loading}>
          {loading ? cards.map(r => <div key={r.id} className="live-card-skeleton motion-safe:animate-pulse" role="status"><span className="sr-only">{labels("loading")}</span><div /><div /><div /></div>) : cards.map((resort) => (
            <ResortCard
              key={resort.id || resort.name}
              resort={resort}
              conditions={observations.find(o => String(o.resortId) === String(resort.id))}
              season={season}
              now={now}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
