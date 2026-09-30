import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import NewsCard from "./NewsCard";
export default function NewsSection({ news }) {
  const t = useTranslations("NewsSection");
  return (
    <section className="bg-canvas px-6 py-20 md:px-10 lg:py-28">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-muted">{t("whatSHappeningIn_ee6a03")}</p>

            <h2 className="mt-4 text-4xl font-black leading-[0.95] md:text-6xl">
              {t("storiesFrom_bb2dbf")}
              <br />

              <span className="mt-4 text-4xl font-black leading-[0.95] md:text-6xl">
                {t("mta_b4d357")}
              </span>
            </h2>
          </div>

          <Link
            href="/news"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-bold tracking-wider text-canvas transition-opacity hover:opacity-80"
          >
            {t("viewAllNews_29b7f8")}
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.slice(0, 3).map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
