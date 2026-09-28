"use client";
import InteractiveTrailMap from "./InteractiveTrailMap";
import { useSiteSeason } from "@/providers/SeasonProvider";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Map } from "lucide-react";
export default function ResortMap({ resort, trailMap }) {
  const t = useTranslations("ResortMap");
  const { season } = useSiteSeason();
  if (trailMap)
    return (
      <section id="maps" className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-[1500px]">
          <h2 className="mb-7 text-3xl font-black">
            {resort.name} · {t("maps_19e909")}
          </h2>
          <InteractiveTrailMap
            map={trailMap}
            resortName={resort.name}
            resortSlug={resort.slug}
          />
          <Link
            href={`/resorts/${resort.slug}/maps`}
            className="mt-6 inline-block font-semibold underline"
          >
            {t("exploreMaps_ddef1e")} ↗
          </Link>
        </div>
      </section>
    );
  return (
    <section id="maps" className="px-6 py-8 md:px-10 lg:px-16 lg:py-12">
      <div className="relative mx-auto flex min-h-[480px] max-w-[1500px] items-end overflow-hidden rounded-2xl bg-ink p-7 text-canvas md:p-12">
        <img
          src={resort.seasons[season].image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,color-mix(in_srgb,var(--color-ink)_88%,transparent),transparent)]" />
        <div className="relative flex w-full flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Map size={24} className="text-border" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[.25em] text-canvas/55">
              {t("exploreTheMountain_e19661")}
            </p>
            <h2 className="mt-4 text-5xl font-black tracking-[-.06em] md:text-7xl">
              {resort.name}
              <br />
              <span className="font-heading font-normal">
                {t("maps_19e909")}
              </span>
            </h2>
          </div>
          <Link
            href={`/resorts/${resort.slug}/maps`}
            className="inline-flex w-fit items-center gap-3 bg-canvas px-6 py-4 text-xs font-bold uppercase tracking-[.16em] text-ink"
          >
            {t("exploreMaps_ddef1e")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
