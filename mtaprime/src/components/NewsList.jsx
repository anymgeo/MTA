"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import NewsCard from "./NewsCard";

export default function NewsList({ news, page = 1, pageCount = 1 }) {
  const t = useTranslations("NewsCategories");
  const locale = useLocale();
  const href = (value) => `/${locale}/news${value === 1 ? "" : `?page=${value}`}`;
  const linkClass = "flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-bold transition hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4";
  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {news.map((article) => <NewsCard key={article.slug} item={article} />)}
      </div>
      {news.length === 0 && <p className="rounded-3xl border border-border bg-surface px-6 py-12 text-center text-muted">{t("empty")}</p>}
      {pageCount > 1 && <nav className="mt-14 flex flex-wrap items-center justify-center gap-2" aria-label={t("pagination")}>
        {page > 1 && <Link className={linkClass} href={href(page - 1)} prefetch={false} aria-label={t("previous")}>←</Link>}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) =>
          <Link key={value} href={href(value)} prefetch={false} aria-current={page === value ? "page" : undefined} aria-label={t("page", { number: value })}
            className={`${linkClass} ${page === value ? "border-ink bg-ink text-white hover:bg-ink" : "bg-canvas text-ink"}`}>{value}</Link>
        )}
        {page < pageCount && <Link className={linkClass} href={href(page + 1)} prefetch={false} aria-label={t("next")}>→</Link>}
      </nav>}
    </>
  );
}
