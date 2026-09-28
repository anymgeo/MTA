"use client";
import ResortIcon from "./brand/ResortIcon";
import MountainAccent from "./brand/MountainAccent";
import SnowOverlay from "./SnowOverlay";

import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
export default function Hero({
  season,
  current,
  resortIndex,
  setResortIndex,
  setModal,
}) {
  const t = useTranslations("Hero");
  const previous = () => {
    setResortIndex((resortIndex - 1 + 4) % 4);
  };
  const next = () => {
    setResortIndex((resortIndex + 1) % 4);
  };
  const background = current.seasons[season].image;
  return (
    <section
      id="top"
      className="season-hero relative min-h-screen overflow-hidden bg-cover bg-center text-canvas"
      style={{
        backgroundImage: `url("${background}")`,
      }}
    >
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-ink/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/30" />

      <div className="season-hero-tint" aria-hidden="true" />
      <MountainAccent />
      {season === "winter" && <SnowOverlay />}
      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col justify-between px-6 pb-8 pt-32 lg:px-10">
        {/* TOP LINE */}
        <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.2em] text-canvas/70">
          <span>{t("officialMountainPlatform_8adb80")}</span>
          {/* <span className="flex items-center gap-1">
            GE / EN <ChevronDown size={14} />
           </span> */}
        </div>

        {/* HERO COPY */}
        <div className="max-w-4xl py-24">
          <p className="mb-5 text-xs font-bold tracking-[0.25em] text-canvas/70">
            {t("theCaucasusIsCalling_4ca7e3")}
          </p>

          <h1 className="hero-title font-black"><span>{t("experience_21ab11")}</span><span>{t("ofGeorgia_4d81fb")}</span></h1>

          <p className="mt-8 max-w-xl text-sm leading-7 text-canvas/75 md:text-base">
            {t("liveMountainConditionsSkiAreasMaps_fd4aca")}
          </p>

          {/* BUTTONS */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setModal("pass")}
              className="bg-white text-ink flex items-center gap-3 rounded-full px-7 py-4 text-xs font-bold tracking-wider transition hover:brightness-110"
            >
              {t("buySkiPass_f7fcbe")}
              <ArrowUpRight size={18} />
            </button>

            <Link
              href="/resorts"
              className="flex items-center gap-3 rounded-full border border-canvas/30 bg-ink/20 px-7 py-4 text-xs font-bold tracking-wider transition hover:bg-canvas hover:text-ink"
            >
              {t("exploreResort")}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>

        {/* MOUNTAIN REPORT */}
        <div className="grid grid-cols-2 border-t border-canvas/20 pt-6 md:grid-cols-4">
          <div>
            <span className="text-[9px] tracking-widest text-canvas/50">
              {t("selectedResort_38fe94")}
            </span>
            <strong className="mt-2 flex items-center gap-2 text-sm"><ResortIcon slug={current.slug} className="h-7 w-7" />{current.name}</strong>
            <small className="text-xs text-canvas/50">{current.region}</small>
          </div>

          <div>
            <span className="text-[9px] tracking-widest text-canvas/50">
              {t("status_716883")}
            </span>
            <strong className="mt-2 block text-sm">
              ● {current.statusLabel}
            </strong>
            <small className="text-xs text-canvas/50">
              {current.lifts} {t("lifts")}
            </small>
          </div>

          <div>
            <span className="text-[9px] tracking-widest text-canvas/50">
              {t("temperature_cc6906")}
            </span>
            <strong className="mt-2 block text-2xl">{current.temp}</strong>
            <small className="text-xs text-canvas/50">
              {t("snow_4bbd1c")}
              {current.snow}
            </small>
          </div>

          <div>
            <span className="text-[9px] tracking-widest text-canvas/50">
              {t("updated_47b23b")}
            </span>
            <strong className="mt-2 block text-2xl">{t("04Min_cdd22e")}</strong>
            <small className="text-xs text-canvas/50">
              {t("liveData_6301f7")}
            </small>
          </div>
        </div>
      </div>

      {/* SLIDER CONTROLS */}
      <div className="absolute bottom-8 right-6 z-20 flex items-center gap-4 lg:right-10">
        <button
          aria-label={t("previousResort")}
          onClick={previous}
          className="rounded-full border border-canvas/30 p-3 transition hover:bg-canvas/10"
        >
          <ChevronLeft />
        </button>

        <span className="text-xs tracking-widest">0{resortIndex + 1} / 04</span>

        <button
          aria-label={t("nextResort")}
          onClick={next}
          className="rounded-full border border-canvas/30 p-3 transition hover:bg-canvas/10"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
