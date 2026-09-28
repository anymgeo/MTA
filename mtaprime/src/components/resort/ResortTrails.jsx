import { useTranslations } from "next-intl";
export default function ResortTrails({ resort }) {
  const t = useTranslations("ResortTrails");
  const colors = [
    "bg-brand-green",
    "bg-brand-cyan",
    "bg-brand-red",
    "bg-ink",
  ];
  return (
    <section
      id="trails"
      className="bg-canvas px-6 py-24 md:px-10 lg:px-16 lg:py-32"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
              {t("04SkiTerrain_480539")}
            </p>
            <h2 className="mt-5 text-6xl font-black leading-[.8] tracking-[-.07em] md:text-8xl">
              {t("findYour_072109")}
              <br />
              <span className="font-heading font-normal">{t("line_328abc")}</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-muted">
            {t("trailDistributionIsAnOrientationGuide_9187e9")}
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {resort.trailDifficulty.map((trail, index) => (
            <div
              key={trail.label}
              className="rounded-xl border border-ink/10 p-6"
            >
              <div className="flex justify-between">
                <h3 className="text-xl font-bold">{trail.label}</h3>
                <span className="text-sm font-bold">{trail.value}%</span>
              </div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full rounded-full ${colors[index]}`}
                  style={{
                    width: `${trail.value}%`,
                  }}
                />
              </div>
              <p className="mt-4 text-sm text-muted">{trail.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
