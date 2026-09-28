"use client";

import { useTranslations } from "next-intl";
import { useSiteSeason } from "@/providers/SeasonProvider";
import SeasonToggle from "@/components/SeasonToggle";
import {
  Bike,
  CloudSnow,
  Footprints,
  Mountain,
  Plane,
  TentTree,
  Waves,
  Wind,
} from "lucide-react";
const iconMap = {
  skiing: Mountain,
  snowboarding: CloudSnow,
  freeride: Wind,
  "ski-touring": Footprints,
  hiking: Footprints,
  "mountain-biking": Bike,
  paragliding: Plane,
  camping: TentTree,
};
export default function ResortExperience({ resort }) {
  const t = useTranslations("ResortExperience");
  const { season } = useSiteSeason();
  const items = resort.experience[season];
  return (
    <section
      id="experience"
      className="bg-border px-6 py-24 md:px-10 lg:px-16 lg:py-32"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
              {t("02InEverySeason_75efb9")}
            </p>
            <h2 className="mt-5 text-6xl font-black leading-[.8] tracking-[-.07em] md:text-8xl">
              {t("chooseYour_c718be")}
              <br />
              <span className="font-heading font-normal">{t("element_2384ee")}</span>
            </h2>
          </div>
          <SeasonToggle />
        </div>
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = iconMap[item.iconKey] || Waves;
            return (
              <article
                key={item.title}
                className="group min-h-60 rounded-2xl border border-ink/10 bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:bg-canvas"
              >
                <Icon size={26} strokeWidth={1.5} className="text-ink" />
                <h3 className="mt-16 text-2xl font-bold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
