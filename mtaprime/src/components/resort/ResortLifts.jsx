import { useTranslations } from "next-intl";
import { ArrowUpRight, CableCar } from "lucide-react";
export default function ResortLifts({ resort }) {
  const t = useTranslations("ResortLifts");
  return (
    <section id="lifts" className="px-6 py-24 md:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
              {t("03MoveUp_0a33f9")}
            </p>
            <h2 className="mt-5 text-6xl font-black leading-[.8] tracking-[-.07em] md:text-7xl">
              {t("lifts_e16d06")}
              <br />
              <span className="font-heading font-normal">{t("access_896e53")}</span>
            </h2>
          </div>
          <div className="border-t border-ink/10 lg:col-span-7 lg:col-start-6">
            {resort.liftList.map((lift, index) => (
              <div
                key={lift.name}
                className="group grid grid-cols-[28px_1fr_auto] items-center gap-4 border-b border-ink/10 py-6"
              >
                <span className="text-xs text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <CableCar size={17} className="text-ink" />
                    <h3 className="font-bold">{lift.name}</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {lift.type} · {lift.hours}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-muted sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                    {t("checkLive_03ff4a")}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="transition group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
