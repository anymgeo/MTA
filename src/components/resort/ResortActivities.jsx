import { useTranslations } from "next-intl";
import { BedDouble, CloudSnow, Footprints, Utensils } from "lucide-react";
export default function ResortActivities() {
  const t = useTranslations("ResortActivities");
  const { cards } = getLocalizedContent(t);
  return (
    <section id="activities" className="px-6 py-24 md:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-[1500px]">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
          {t("05BeyondTheSlopes_bd9b0c")}
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([title, Icon, text]) => (
            <article key={title} className="rounded-2xl bg-surface p-6">
              <Icon size={24} strokeWidth={1.5} />
              <h3 className="mt-16 text-3xl font-bold tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
function getLocalizedContent(t) {
  const cards = [
    [
      t("hiking_1bb9e8"),
      Footprints,
      t("walkTheRidgelinesAndForestPaths_4b2f61"),
    ],
    [
      t("freeride_9dda2d"),
      CloudSnow,
      t("discoverTheMountainWithQualifiedLocal_222229"),
    ],
    [t("food_35b259"), Utensils, t("tasteRegionalHospitalityAfterADay_97eaa4")],
    [t("stay_ae768f"), BedDouble, t("wakeUpCloserToTheFirst_163c7c")],
  ];
  return {
    cards,
  };
}
