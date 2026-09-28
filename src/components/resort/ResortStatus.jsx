import { useTranslations } from "next-intl";
import { ArrowUpRight, CloudSnow, Mountain, Wind } from "lucide-react";
export default function ResortStatus({ resort }) {
  const t = useTranslations("ResortStatus");
  const facts = [
    [t("snowDepth_371b05"), resort.snow, CloudSnow],
    [t("wind_142b57"), resort.wind, Wind],
    [
      t("liftNetwork_472f5a"),
      t("value0Listed_384863", {
        value0: resort.lifts,
      }),
      Mountain,
    ],
    [t("highestPoint_99bc4a"), resort.highestPoint, Mountain],
  ];
  return (
    <section className="bg-ink px-6 py-20 text-canvas md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[.8fr_2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-canvas/45">
            {t("mountainStatus_b7d976")}
          </p>
          <h2 className="mt-5 text-4xl font-bold tracking-[-.05em]">
            {t("liveConditions_fff154")}
            <br />
            <span className="font-heading font-normal">
              {t("officiallyChecked_ace7e1")}
            </span>
          </h2>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-canvas/15 md:grid-cols-4">
            {facts.map(([label, value, Icon]) => (
              <div key={label} className="bg-ink p-5">
                <Icon size={18} className="text-border" />
                <p className="mt-9 text-xl font-bold">{value}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-canvas/45">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <a
            href="https://status.mta.ski/en"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[.16em] text-border"
          >
            {t("openOfficialLiveStatus_d0988f")}
            <ArrowUpRight size={16} />
          </a>
          <p className="mt-3 text-xs text-canvas/45">
            {t("availabilityAndOperatingConditionsAreConfirmed_5160a3")}
          </p>
        </div>
      </div>
    </section>
  );
}
