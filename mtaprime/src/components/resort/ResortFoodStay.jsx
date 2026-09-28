import { useTranslations } from "next-intl";
import { BedDouble, HeartPulse, Utensils } from "lucide-react";
export default function ResortFoodStay() {
  const t = useTranslations("ResortFoodStay");
  const items = [
    [
      t("restaurants_94a387"),
      t("localFlavoursWarmTablesAndApr_011142"),
      Utensils,
    ],
    [
      t("accommodation_b2ca1c"),
      t("fromPracticalMountainStaysToLong_a96395"),
      BedDouble,
    ],
    [
      t("wellness_3ac645"),
      t("recoverWellBreatheDeeplyAndReset_a7749e"),
      HeartPulse,
    ],
  ];
  return (
    <section
      id="food-stay"
      className="bg-ink px-6 py-24 text-canvas md:px-10 lg:px-16 lg:py-32"
    >
      <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-canvas/45">
            {t("06StayLonger_c15229")}
          </p>
          <h2 className="mt-5 text-6xl font-black leading-[.8] tracking-[-.07em] md:text-8xl">
            {t("theGood_8aa57e")}
            <br />
            <span className="font-heading font-normal">
              {t("kindOfTired_faa56e")}
            </span>
          </h2>
        </div>
        <div className="space-y-3 lg:col-span-6 lg:col-start-7">
          {items.map(([title, text, Icon]) => (
            <article
              key={title}
              className="rounded-xl border border-canvas/15 p-6 transition hover:bg-canvas/8"
            >
              <Icon size={21} className="text-border" />
              <h3 className="mt-8 text-2xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-canvas/60">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
