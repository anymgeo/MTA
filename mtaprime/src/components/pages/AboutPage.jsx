"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  Mountain,
  ShieldCheck,
} from "lucide-react";
import RichText from '@/components/content/RichText';
export default function AboutPage({ resorts, content }) {
  const t = useTranslations("AboutPage");
  const { values } = getLocalizedContent(t);
  const visible = true;
  return (
    <main className="about-page bg-canvas text-ink">
      {/* =========================================================
          HERO
       ========================================================= */}
      <section className="relative min-h-screen overflow-hidden bg-ink text-canvas">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/Gudauri.jpg"
            alt={t("gudauriMountains_b71863")}
            className="h-full w-full scale-105 object-cover transition-transform duration-[2500ms]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
        </div>

        {/* Color accents */}
        <div className="absolute right-[8%] top-[22%] h-24 w-24 rounded-full bg-brand-green/20 blur-3xl" />
        <div className="absolute left-[40%] top-[18%] h-16 w-16 rounded-full bg-brand-cyan/20 blur-2xl" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col justify-between px-6 pb-10 pt-36 lg:px-10">
          {/* top */}
          <div className="flex items-start justify-between">
            <div
              className={`transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-canvas/20 bg-canvas/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                {t("aboutMta_7850e0")}
              </span>
            </div>

            <div className="hidden text-right md:block">
              <span className="text-xs uppercase tracking-[0.3em] text-canvas/50">
                {t("mountainTrailsAgency_1ebf43")}
              </span>

              <p className="mt-2 text-sm text-canvas/70">
                {t("georgia_9113c6")}
              </p>
            </div>
          </div>

          {/* Hero text */}
          <div
            className={`max-w-6xl transition-all delay-200 duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
          >
            <p className="mb-6 max-w-xl text-sm font-medium uppercase tracking-[0.25em] text-canvas/60">
              {t("developingGeorgiaSMountainDestinations_711320")}
            </p>

            <h1 className="max-w-6xl about-hero-title font-semibold">
              {t("mountains_06beda")}
              <br />
              <span className="text-brand-cyan">{t("made_e572f9")}</span>
              <br />
              {t("memorable_837046")}
            </h1>
          </div>

          {/* Bottom */}
          <div className="flex flex-col gap-8 border-t border-canvas/20 pt-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-base leading-7 text-canvas/65 md:text-lg">
              {t("mountainTrailsAgencyManagesAndDevelops_b50212")}
            </p>

            <div className="flex items-center gap-4">
              <span className="hidden text-xs uppercase tracking-[0.2em] text-canvas/40 md:block">
                {t("scrollToExplore_f0f447")}
              </span>

              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-canvas/20">
                <ArrowDownRight size={19} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRO
       ========================================================= */}
      <section className="px-6 py-24 md:py-32 lg:px-10 lg:py-40">
        <div className="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="brand-eyebrow">{t("whoWeAre_cdab44")}</p>

            <h2 className="mt-6 about-section-title font-semibold">
              {t("moreThan_20c383")}
              <br />
              {t("skiResorts_1361db")}
            </h2>
          </div>

          <div className="max-w-3xl">
            <p className="text-2xl font-medium leading-tight tracking-tight md:text-4xl">
              {t("weDevelopThePlacesWhereGeorgia_7b402b")}
            </p>

            <div className="mt-10 grid gap-8 text-base leading-7 text-muted md:grid-cols-2">
              <p><RichText text={content?.mainText ?? t("mountainTrailsAgencyIsResponsibleFor_e3fbd5")} /></p>

              <p><RichText text={content?.historyText ?? t("ourWorkCoversMountainInfrastructureOperations_b9e9e8")} /></p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BIG IMAGE / STATEMENT
       ========================================================= */}
      <section className="px-4 lg:px-8">
        <div className="relative mx-auto max-w-[1700px] overflow-hidden rounded-[2rem]">
          <img
            src="/MESTIA.webp"
            alt={t("mestiaMountains_965f5e")}
            className="h-[70vh] w-full object-cover transition duration-700 hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

          <div className="absolute bottom-0 left-0 p-8 text-canvas md:p-14 lg:p-20">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-canvas/60">
              {t("ourPerspective_87cc69")}
            </span>

            <h2 className="mt-5 max-w-4xl about-section-title font-semibold">
              {t("theMountainsAreNotJustDestinations_841e7d")}
            </h2>
          </div>
        </div>
      </section>

      {/* =========================================================
          RESORTS EDITORIAL GRID
       ========================================================= */}
      <section className="px-6 py-24 lg:px-10 lg:py-40">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="brand-eyebrow">{t("ourDestinations_81d6d2")}</p>

              <h2 className="mt-5 about-section-title font-semibold">
                {t("fourPlaces_63813c")}
                <br />
                {t("oneVision_65e632")}
              </h2>
            </div>

            <p className="max-w-md text-base leading-7 text-muted">
              {t("everyResortHasItsOwnCharacter_b16a64")}
            </p>
          </div>

          {/* First row */}
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <ResortCard resort={resorts[0]} large />

            <ResortCard resort={resorts[1]} />
          </div>

          {/* Second row */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.65fr_1.35fr]">
            <ResortCard resort={resorts[2]} />

            <ResortCard resort={resorts[3]} large />
          </div>
        </div>
      </section>

      {/* =========================================================
          VALUES
       ========================================================= */}
      <section className="bg-surface px-6 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="brand-eyebrow">{t("whatDrivesUs_e3c0ba")}</p>

              <h2 className="mt-6 about-section-title font-semibold">
                {t("builtFor_2eba6b")}
                <br />
                {t("theMountain_9ee4bc")}
              </h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-3xl bg-border md:grid-cols-2">
              {values.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.number}
                    className="bg-surface p-8 md:p-10 lg:p-12"
                  >
                    <div className="flex items-start justify-between">
                      <span className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-sm font-bold text-ink">
                        {item.number}
                      </span>

                      <Icon
                        size={25}
                        strokeWidth={1.5}
                        className="text-muted"
                      />
                    </div>

                    <h3 className="mt-20 text-3xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-5 max-w-sm leading-7 text-muted">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HISTORY
       ========================================================= */}
      <section className="px-6 py-24 lg:px-10 lg:py-40">
        <div className="mx-auto max-w-[1500px]">
          <div className="max-w-3xl">
            <p className="brand-eyebrow">{t("ourStory_5a2d8e")}</p>

            <h2 className="mt-6 about-section-title font-semibold">
              {t("fromOneResort_888df6")}
              <br />
              {t("toAMountainNetwork_cc6726")}
            </h2>
          </div>

          <div className="mt-20 border-t border-border">
            <TimelineItem
              year="2013"
              title={t("theBeginning_207e16")}
              text={t("history0")}
            />

            <TimelineItem
              year="2014"
              title={t("growingBeyondGudauri_60d9de")}
              text={t("history1")}
            />

            <TimelineItem
              year="2017"
              title={t("aNationalNetwork_77d466")}
              text={t("history2")}
            />

            <TimelineItem
              year="2022"
              title={t("mountainTrailsAgency_1ebf43")}
              text={t("history3")}
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          FOUR SEASONS
       ========================================================= */}
      <section className="bg-ink px-4 py-24 text-canvas lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1700px]">
          <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="brand-eyebrow">{t("allYearRound_10052a")}</p>

              <h2 className="mt-5 about-section-title font-semibold">
                {t("georgiaSMountains_087511")}
                <br />
                {t("neverStop_129f45")}
              </h2>
            </div>

            <p className="max-w-md text-canvas/50">
              {t("winterSportsSummerTrailsFreshAir_6e6a4e")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SeasonCard
              image="/Gudauri.jpg"
              title={t("winter_24615d")}
              color="bg-brand-cyan"
            />

            <SeasonCard
              image="/Bakuriani.jpg"
              title={t("spring_896776")}
              color="bg-brand-green"
            />

            <SeasonCard
              image="/MESTIA.webp"
              title={t("summer_7c92fc")}
              color="bg-brand-yellow"
            />

            <SeasonCard
              image="/Goderdzi.webp"
              title={t("autumn_36da46")}
              color="bg-brand-red"
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
       ========================================================= */}
      <section className="relative overflow-hidden px-6 py-32 lg:px-10 lg:py-48">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-[1400px] text-center">
          <p className="brand-eyebrow">{t("discoverGeorgia_046f95")}</p>

          <h2 className="mx-auto mt-6 max-w-5xl text-6xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-8xl lg:text-[9rem]">
            {t("theMountains_e7bbb9")}
            <br />
            {t("areWaiting_144ca1")}
          </h2>

          <Link
            href="/resorts"
            className="group mt-12 inline-flex items-center gap-4 rounded-full bg-ink px-8 py-5 text-sm font-bold text-canvas transition-all duration-300 hover:bg-neutral-700"
          >
            {t("exploreResorts_609a31")}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/10 transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   RESORT CARD
========================================================= */

function ResortCard({ resort, large = false }) {
  return (
    <Link
      href={resort.href}
      className={`group relative block overflow-hidden rounded-[1.75rem] ${large ? "min-h-[620px] lg:min-h-[700px]" : "min-h-[500px]"}`}
    >
      <img
        src={resort.image}
        alt={resort.name}
        className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

      <div className="absolute left-0 top-0 p-6 text-canvas md:p-8">
        <span className="text-xs font-bold tracking-[0.2em] text-canvas/60">
          {resort.number}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-7 text-canvas md:p-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-canvas/60">
              {resort.region}
            </p>

            <h3
              className={`font-semibold leading-none tracking-tight ${large ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"}`}
            >
              {resort.name}
            </h3>

            <p className="mt-5 max-w-md text-sm leading-6 text-canvas/65 md:text-base">
              {resort.description}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-canvas/30 bg-canvas/10 backdrop-blur-md transition duration-300 group-hover:bg-neutral-700 group-hover:border-neutral-700">
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   TIMELINE ITEM
========================================================= */

function TimelineItem({ year, title, text }) {
  return (
    <div className="grid gap-6 border-b border-border py-10 md:grid-cols-[160px_1fr_1fr] md:items-center">
      <span className="text-4xl font-semibold tracking-tight text-brand-green">
        {year}
      </span>

      <h3 className="text-2xl font-semibold">{title}</h3>

      <p className="max-w-lg leading-7 text-muted">{text}</p>
    </div>
  );
}

/* =========================================================
   SEASON CARD
========================================================= */

function SeasonCard({ image, title, color }) {
  return (
    <div className="group relative min-h-[400px] overflow-hidden rounded-[1.5rem]">
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-ink/20 transition duration-500 group-hover:bg-ink/35" />

      <div className="absolute left-7 top-7 md:left-10 md:top-10">
        <span
          className={`inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-ink ${color}`}
        >
          {title}
        </span>
      </div>

      <div className="absolute bottom-7 left-7 md:bottom-10 md:left-10">
        <h3 className="text-4xl font-semibold tracking-tight md:text-6xl">
          {title}
        </h3>
      </div>
    </div>
  );
}
function getLocalizedContent(t) {
  const values = [
    {
      number: "01",
      title: t("safety_db6e7e"),
      text: t("everyMountainExperienceStartsWithSafe_7598a5"),
      icon: ShieldCheck,
    },
    {
      number: "02",
      title: t("experience_5b5aaf"),
      text: t("weCreateDestinationsPeopleWantTo_7efa16"),
      icon: Mountain,
    },
  ];
  return {
    values,
  };
}
