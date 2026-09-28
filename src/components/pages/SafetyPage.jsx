"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { EmergencyBlock } from "@/components/content/ContentUI";
export default function SafetyPage({ contacts = [] }) {
  const t = useTranslations("SafetyPage");
  const p = useTranslations("Portal"),
    v = useTranslations("MountainViews");
  const { safetyRules, mountainRules, patrolItems, closedZoneReasons } =
    getLocalizedContent(t);
  const [openEmergency, setOpenEmergency] = useState(null);
  return (
    <main className="safety-page bg-canvas text-ink">
      {/* HERO */}
      <section
        className="relative min-h-[650px] overflow-hidden bg-ink"
        style={{
          backgroundImage: "url('/Gudauri.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/65 to-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[650px] max-w-7xl items-end px-6 pb-20 lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-canvas/20 bg-canvas/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-canvas backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-brand-red" />
              {t("mountainSafety_3474c3")}
            </div>

            <h1 className="text-5xl font-bold leading-[0.95] tracking-tight text-canvas md:text-7xl">
              {t("safetyOn_6f8271")}
              <br />
              {t("theMountain_9ee4bc")}
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-canvas/75 md:text-xl">
              {t("knowTheRulesUnderstandTheConditions_3ae240")}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#emergency"
                className="rounded-full bg-ink px-7 py-4 text-sm font-bold text-white transition hover:bg-ink"
              >
                {t("emergency_3efeb7")}
              </a>

              <a
                href="#safety-rules"
                className="rounded-full border border-canvas/30 bg-canvas/10 px-7 py-4 text-sm font-bold text-canvas backdrop-blur-md transition hover:bg-canvas/20"
              >
                {t("safetyRules_d13fa2")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK NAV */}
      <section className="sticky top-24 z-40 border-b border-ink/10 bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6 py-4 lg:px-10">
          <a
            href="#emergency"
            className="whitespace-nowrap text-sm font-bold text-ink"
          >
            {t("emergency_3efeb7")}
          </a>
          <a
            href="#safety-rules"
            className="whitespace-nowrap text-sm font-semibold text-ink/60 hover:text-white"
          >
            {t("safetyRules_a269cd")}
          </a>
          <a
            href="#mountain-rules"
            className="whitespace-nowrap text-sm font-semibold text-ink/60 hover:text-white"
          >
            {t("mountainRules_f958a8")}
          </a>
          <a
            href="#patrol"
            className="whitespace-nowrap text-sm font-semibold text-ink/60 hover:text-white"
          >
            {t("patrol_b67ed8")}
          </a>
          <a
            href="#closed-zones"
            className="whitespace-nowrap text-sm font-semibold text-ink/60 hover:text-white"
          >
            {t("closedZones_a96453")}
          </a>
        </div>
      </section>

      {/* EMERGENCY */}
      <section
        id="emergency"
        className="scroll-mt-44 border-y border-brand-red/20 bg-brand-red/5 py-20 text-ink"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {contacts.length > 0 && <EmergencyBlock contacts={contacts} />}
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-ink">
                {t("emergency_3efeb7")}
              </span>

              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                {t("needHelp_97e2e9")}
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-muted">
                {t("ifYouOrSomeoneAroundYou_81b95c")}
              </p>

              <div className="mt-8 flex items-center gap-5">
                <a
                  href="tel:112"
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-red text-2xl font-black text-ink"
                >
                  112
                </a>

                <div>
                  <div className="font-bold">
                    {t("emergencyServices_cb9629")}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {t("available24Hours_38731b")}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: t("accidentOrInjury_846c41"),
                  text: t("contactEmergencyServicesOrMountainPatrol_d9217e"),
                },
                {
                  title: t("lostOnTheMountain_2b0a45"),
                  text: t("stayInASafeLocationAnd_f9e287"),
                },
                {
                  title: t("dangerousConditions_d9c106"),
                  text: t("moveToASafeLocationAnd_da82a1"),
                },
                {
                  title: t("whatToProvide_5c64bb"),
                  text: t("giveYourResortSlopeLiftLandmark_6e9075"),
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border bg-canvas p-7 shadow-sm"
                >
                  <button
                    type="button"
                    aria-expanded={openEmergency === index}
                    onClick={() =>
                      setOpenEmergency(openEmergency === index ? null : index)
                    }
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="font-bold">{item.title}</span>
                    <span className="text-2xl text-ink">
                      {openEmergency === index ? "−" : "+"}
                    </span>
                  </button>

                  {openEmergency === index && (
                    <p className="mt-5 text-sm leading-7 text-muted">
                      {item.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="brand-eyebrow">{v("safetyTopics")}</p>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            {v("safetyIntro")}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "code-of-conduct",
              "piste-classification",
              "mountain-patrol",
              "emergency-contacts",
              "closures",
              "avalanche-danger",
              "freeride-rules",
              "incident",
            ].map((topic) => (
              <Link
                key={topic}
                href={"/safety/" + topic}
                className="rounded-2xl border border-border bg-surface p-6 font-semibold text-ink transition hover:-translate-y-1 hover:bg-canvas hover:shadow-lg"
              >
                {p("titles." + topic)} <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* SAFETY RULES */}
      <section id="safety-rules" className="scroll-mt-44 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-ink">
              {t("01SafetyRules_5fe225")}
            </span>

            <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
              {t("rideSmart_247cf3")}
              <br />
              {t("staySafe_3ea7f9")}
            </h2>

            <p className="mt-6 text-lg leading-8 text-muted">
              {t("aFewSimplePrinciplesCanMake_5e5eec")}
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-3">
            {safetyRules.map((rule) => (
              <article
                key={rule.number}
                className="bg-canvas p-8 transition duration-200 hover:bg-surface md:p-10"
              >
                <div className="text-sm font-black text-ink">{rule.number}</div>

                <h3 className="mt-8 text-xl font-bold">{rule.title}</h3>

                <p className="mt-4 text-sm leading-7 text-muted">{rule.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MOUNTAIN RULES */}
      <section id="mountain-rules" className="scroll-mt-44 bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-ink">
                {t("02MountainRules_3067f8")}
              </span>

              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                {t("knowThe_6295eb")}
                <br />
                {t("mountainRules_644b25")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-muted">
                {t("everySkierAndSnowboarderIsResponsible_3b40d8")}
              </p>
            </div>

            <div className="divide-y divide-ink/10">
              {mountainRules.map((rule) => (
                <div
                  key={rule.number}
                  className="grid gap-5 py-7 md:grid-cols-[70px_1fr]"
                >
                  <div className="text-sm font-black text-ink/25">
                    {rule.number}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{rule.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                      {rule.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PATROL */}
      <section id="patrol" className="scroll-mt-44 bg-canvas py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid overflow-hidden rounded-[2rem] border border-border bg-surface lg:grid-cols-2">
            <div
              className="min-h-[500px] bg-cover bg-center"
              style={{
                backgroundImage: "url('/Gudauri.jpg')",
              }}
            />

            <div className="p-8 text-ink md:p-12 lg:p-16">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-ink">
                {t("03Patrol_eb737b")}
              </span>

              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
                {t("mountainPatrol_ba056b")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-muted">
                {t("mountainPatrolTeamsHelpMaintainSafe_8c956a")}
              </p>

              <div className="mt-10 space-y-4">
                {patrolItems.map((item) => (
                  <div
                    key={item}
                    className="flex gap-4 border-b border-canvas/10 pb-4"
                  >
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan text-xs font-black text-ink">
                      ✓
                    </span>

                    <span className="text-sm text-muted">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSED ZONES */}
      <section
        id="closed-zones"
        className="scroll-mt-44 border-t border-ink/10 py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-ink">
                {t("04ClosedZones_883e13")}
              </span>

              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                {t("respectClosedAreas_50719c")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-muted">
                {t("mountainAreasCanBeTemporarilyClosed_a0ac04")}
              </p>
            </div>

            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 px-6 py-5">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-ink">
                {t("important_4b6d6a")}
              </div>
              <div className="mt-2 font-bold">
                {t("neverEnterAClosedZone_8fb6f7")}
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {closedZoneReasons.map((item, index) => (
              <article
                key={item.title}
                className="group rounded-3xl border border-ink/10 p-8 transition hover:-translate-y-1 hover:shadow-xl md:p-10"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10 font-black text-ink">
                    0{index + 1}
                  </span>

                  <span className="text-2xl text-ink/10 transition group-hover:text-white">
                    ↗
                  </span>
                </div>

                <h3 className="mt-8 text-xl font-bold">{item.title}</h3>

                <p className="mt-4 text-sm leading-7 text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-green py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-ink">
                {t("beforeYouGo_ca55e2")}
              </span>

              <h2 className="mt-3 text-4xl font-bold tracking-tight text-ink md:text-5xl">
                {t("knowTheMountain_bee7d9")}
                <br />
                {t("enjoyTheRide_88d027")}
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/resorts"
                className="rounded-full bg-canvas px-6 py-4 text-sm font-bold text-ink transition hover:bg-canvas/90"
              >
                {t("exploreResorts_609a31")}
              </Link>

              <Link
                href="/"
                className="rounded-full border border-canvas/30 px-6 py-4 text-sm font-bold text-canvas transition hover:bg-canvas/10"
              >
                {t("liveMountainStatus_0bace5")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
function getLocalizedContent(t) {
  const safetyRules = [
    {
      number: "01",
      title: t("knowYourAbility_0d7014"),
      text: t("chooseSlopesAndActivitiesThatMatch_7bfcdd"),
    },
    {
      number: "02",
      title: t("stayInControl_4990b6"),
      text: t("alwaysMaintainControlOfYourSpeed_fe0d76"),
    },
    {
      number: "03",
      title: t("respectOthers_ce905c"),
      text: t("doNotEndangerOtherGuestsKeep_4019bc"),
    },
    {
      number: "04",
      title: t("followSigns_6c1512"),
      text: t("respectAllSignsMarkingsBarriersAnd_35f3fc"),
    },
    {
      number: "05",
      title: t("stopSafely_46ebd3"),
      text: t("avoidStoppingInNarrowPassagesBlind_068a44"),
    },
    {
      number: "06",
      title: t("checkConditions_917cb3"),
      text: t("weatherSnowAndMountainConditionsCan_73fdd3"),
    },
  ];
  const mountainRules = [
    {
      number: "01",
      title: t("respectTheSkierAhead_7464e8"),
      text: t("theSkierOrSnowboarderInFront_31b380"),
    },
    {
      number: "02",
      title: t("overtakeSafely_bee958"),
      text: t("youMayOvertakeFromEitherSide_b47229"),
    },
    {
      number: "03",
      title: t("lookUphill_b3cd97"),
      text: t("beforeStartingMergingOrCrossingA_df74cd"),
    },
    {
      number: "04",
      title: t("keepClear_4a2e2a"),
      text: t("doNotRemainInAreasWhere_429291"),
    },
    {
      number: "05",
      title: t("useMarkedRoutes_a2b2e7"),
      text: t("stayWithinDesignatedSkiingAreasAnd_66a21f"),
    },
    {
      number: "06",
      title: t("assistAfterAnAccident_e12f7e"),
      text: t("ifYouWitnessAnAccidentProvide_809bb2"),
    },
  ];
  const patrolItems = [
    t("respondingToAccidentsAndEmergencies_861d3f"),
    t("monitoringSlopesAndMountainConditions_c5a0af"),
    t("providingFirstResponseAssistance_370f95"),
    t("helpingGuestsWhoAreLostOr_4918a8"),
    t("monitoringClosedAndRestrictedAreas_1da4c6"),
    t("workingWithEmergencyAndRescueServices_7ae794"),
  ];
  const closedZoneReasons = [
    {
      title: t("avalancheRisk_6402c5"),
      text: t("areasMayBeClosedWhenSnow_f79660"),
    },
    {
      title: t("weatherConditions_bbd40f"),
      text: t("strongWindPoorVisibilityOrSevere_71fe53"),
    },
    {
      title: t("slopeMaintenance_8f5adf"),
      text: t("slopesCanBeClosedWhileGrooming_f8c87b"),
    },
    {
      title: t("rescueOperations_942986"),
      text: t("areasMayBeRestrictedWhileEmergency_717dff"),
    },
  ];
  return {
    safetyRules,
    mountainRules,
    patrolItems,
    closedZoneReasons,
  };
}
