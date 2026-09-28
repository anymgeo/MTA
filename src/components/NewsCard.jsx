import LocalizedDate from "@/components/LocalizedDate";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import NewsCategoryTag from "./NewsCategoryTag";
export default function NewsCard({ item }) {
  const t = useTranslations("NewsCard");
  return (
    <article className="news-card group flex h-full flex-col overflow-hidden rounded-3xl bg-canvas">
      <Link href={`/news/${item.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <NewsCategoryTag category={item.category} className="absolute left-5 top-5" />
        </div>

        <div className="flex flex-1 flex-col p-6 md:p-7">
          <p className="text-xs font-semibold text-muted">
            {<LocalizedDate value={item.date} />}
          </p>

          <h3 className="mt-3 text-2xl font-black leading-tight group-hover:underline decoration-brand-red underline-offset-4">{item.title}</h3>

          <p className="mt-3 mb-6 line-clamp-2 text-base leading-7 text-muted">{item.excerpt}</p>

          <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-5 text-xs font-bold">
            {t("readArticle_47faf7")}
            <ArrowUpRight size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}
