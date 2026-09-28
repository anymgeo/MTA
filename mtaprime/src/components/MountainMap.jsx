"use client";

import { Compass, Map } from "lucide-react";
import { useSiteSeason } from "@/providers/SeasonProvider";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
export default function MountainMap() {
  const t = useTranslations("MountainMap");
  const [filter, setFilter] = useState("ALL");
  const { season } = useSiteSeason();
  const common = useTranslations("Common");
  return (
    <section id="map" className="grid min-h-[700px] lg:grid-cols-[0.8fr_1.2fr]">
      {/* LEFT CONTENT PANEL */}
      <div className="flex flex-col justify-center bg-border px-6 py-20 md:px-12 lg:px-20">
        <p className="mb-5 text-xs font-bold tracking-[0.25em] text-ink/50">
          {season === "summer"
            ? t("summerTrails_8e28c3")
            : t("navigateTheTerrain_67692e")}
        </p>

        <h2 className="text-5xl font-black leading-[0.9] tracking-tight md:text-6xl">
          {t("explore_ae26c4")}
          <br />
          <span className="font-heading font-normal">{t("theMountain_261123")}</span>
        </h2>

        <p className="mt-8 max-w-md leading-7 text-ink/60">
          {t("planEveryTurnWithOfficialTrail_351947")}
        </p>

        <Link
          href="/resorts/gudauri-kobi/maps"
          className="mt-8 flex w-fit items-center gap-3 rounded-full bg-ink px-7 py-4 text-xs font-bold tracking-wider text-canvas transition-colors duration-200 hover:bg-ink/80"
        >
          {t("openInteractiveMap_cfed65")}
          <Map size={18} />
        </Link>
      </div>

      {/* RIGHT MAP DISPLAY */}
      <div className="relative min-h-[550px] overflow-hidden bg-border">
        {/* TOPOGRAPHIC LINES OVERLAY */}
        <div
          className="absolute inset-[-20%] opacity-40"
          style={{
            backgroundImage: `
              repeating-radial-gradient(
                ellipse at center,
                transparent 0,
                transparent 35px,
                color-mix(in srgb,var(--color-ink) 12%,transparent) 36px,
                transparent 37px,
                transparent 70px
              )
            `,
          }}
        />

        {/* CONTOUR MAP RINGS */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[40%] border border-ink/20" />
        <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[40%] border border-ink/20" />

        {/* PEAK MARKER */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 text-center text-xs font-bold tracking-wider text-ink">
          {t("kudebi_d62fbd")}
          <br />
          <span className="text-ink/50">{t("3006M_8a398a")}</span>
        </div>

        {/* MAP LABELS */}
        <div className="absolute left-[25%] top-[45%] text-[10px] font-bold tracking-wider text-ink">
          {t("gondola01_d38ceb")}
        </div>

        <div className="absolute bottom-[35%] right-[20%] text-[10px] font-bold tracking-wider text-ink">
          {t("narrowGauge_87f17c")}
        </div>

        {/* ZOOM & COMPASS CONTROLS */}
        <div className="absolute right-6 top-6 flex flex-col overflow-hidden rounded-lg bg-canvas shadow-lg">
          <button
            type="button"
            aria-label={t("zoomIn_4fc05f")}
            className="p-3 text-lg transition-colors hover:bg-surface"
          >
            +
          </button>
          <button
            type="button"
            aria-label={t("zoomOut_a4ae4b")}
            className="border-t border-border p-3 text-lg transition-colors hover:bg-surface"
          >
            −
          </button>
          <button
            type="button"
            aria-label={t("resetOrientation_c95f61")}
            className="border-t border-border p-3 transition-colors hover:bg-surface"
          >
            <Compass size={17} />
          </button>
        </div>

        {/* LAYER FILTER PILL */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 overflow-hidden rounded-full bg-canvas p-1 shadow-lg">
          {["ALL", "LIFTS", "TRAILS", "SAFETY"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-[9px] font-bold tracking-wider transition-colors duration-200 ${filter === item ? "bg-ink text-canvas" : "text-muted hover:bg-surface"}`}
            >
              {common(item.toLowerCase())}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
