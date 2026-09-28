import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
export default function Activities({ activities = [] }) {
  const t = useTranslations("Portal");
  return (
    <section id="events" className="bg-surface px-6 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-12 max-w-3xl">
          <h2 className="mt-4 text-4xl font-black md:text-6xl">
            {t("exploreResortHeading")}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((item, i) => (
            <Link
              href={item.href}
              key={item.id}
              className={`news-card group relative isolate flex min-h-[320px] items-end overflow-hidden rounded-3xl bg-ink p-7 text-canvas md:min-h-[380px] ${i === 0 || i === 3 ? "lg:col-span-2" : ""}`}
            >
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
              <div className="flex w-full items-end justify-between gap-5">
                <h3 className="max-w-xl text-3xl font-black leading-tight">
                  {item.title}
                </h3>
                <ArrowUpRight
                  aria-hidden="true"
                  className="shrink-0"
                  size={26}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
