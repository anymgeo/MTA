"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteSeason } from "@/providers/SeasonProvider";
import ResortIcon from "./brand/ResortIcon";
import ResortIdentity from "./resort/ResortIdentity";
import { ArrowUpRight } from "lucide-react";
export default function ExploreResorts({ resorts = [], directory = false }) {
  const t = useTranslations("ExploreResorts");
  const { season } = useSiteSeason();
  const Heading = directory ? "h1" : "h2";
  return (
    <section id="resorts" className={`bg-surface px-6 pb-24 md:px-10 lg:pb-32 ${directory ? "pt-40" : "pt-24 lg:pt-32"}`}>
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-14 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-ink">
              {t("mountainResorts_aa7adf")}
            </p>

            <Heading className="text-5xl font-black leading-[0.9] tracking-tight md:text-6xl lg:text-7xl">
              {t("exploreGeorgiaS_c00e93")}
              <br />
              <span className="font-heading font-normal">
                {t("mountains_d17fd6")}
              </span>
            </Heading>
          </div>

          <p className="max-w-xl leading-7 text-muted lg:ml-auto">
            {t("fromTheLegendarySlopesOfGudauri_be0b0f")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {resorts.map((resort, index) => {
            const isOpen = resort.status === "OPEN";
            return (
              <Link
                key={resort.id}
                data-resort={resort.slug}
                href={`/resorts/${resort.slug}`}
                className="resort-brand-card group relative block aspect-[4/5] overflow-hidden bg-ink"
              >
                <img
                  src={resort.seasons[season].image}
                  alt={resort.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-canvas">
                  {directory ? <ResortIdentity resort={resort} className="mb-4" /> : <ResortIcon slug={resort.slug} className="mb-4 h-11 w-11" />}
                  <span className="text-xs font-bold tracking-widest text-canvas/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="mt-3 text-2xl font-bold tracking-tight">
                    {resort.name}
                  </h3>

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-canvas/70">
                    {resort.region}

                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </p>

                  {!directory && <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${isOpen ? "bg-brand-green" : "bg-brand-yellow"}`}
                    />

                    <span>{resort.statusLabel}</span>

                    <span className="text-canvas/40">·</span>

                    <span>{resort.temp}</span>
                  </div>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
