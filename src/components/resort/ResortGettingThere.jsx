import { useTranslations } from "next-intl";
import { CarFront, MapPinned, Navigation, UsersRound } from "lucide-react";
export default function ResortGettingThere({ resort }) {
  const t = useTranslations("ResortGettingThere");
  const ways = [
    [t("byCar_4d2219"), resort.transport.car, CarFront],
    [t("transfer_cbb4cc"), resort.transport.transfer, UsersRound],
    [
      t("roadConditions_2f438c"),
      t("alwaysCheckCurrentRoadAndWeather_df4993"),
      Navigation,
    ],
  ];
  return (
    <section
      id="getting-there"
      className="px-6 py-24 md:px-10 lg:px-16 lg:py-32"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
              {t("07JourneyWell_cae144")}
            </p>
            <h2 className="mt-5 text-6xl font-black leading-[.8] tracking-[-.07em] md:text-7xl">
              {t("getting_c39d2f")}
              <br />
              <span className="font-heading font-normal">{t("there_146092")}</span>
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {ways.map(([title, text, Icon]) => (
              <article
                key={title}
                className="border-t border-ink/15 pt-5"
              >
                <Icon size={22} className="text-ink" />
                <h3 className="mt-8 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
        <a
          href={resort.transport.routeUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-12 inline-flex items-center gap-3 rounded-full bg-ink px-6 py-4 text-xs font-bold uppercase tracking-[.16em] text-canvas"
        >
          <MapPinned size={16} />
          {t("planYourRoute_ae8db3")}
        </a>
      </div>
    </section>
  );
}
