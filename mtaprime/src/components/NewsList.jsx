"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import NewsCard from "./NewsCard";

const categories = ["all", "news", "article", "blog"];

export default function NewsList({ news }) {
  const t = useTranslations("NewsCategories");
  const [category, setCategory] = useState("all");
  const visible = category === "all" ? news : news.filter((item) => (item.category || "news") === category);
  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
        {categories.map((value) => (
          <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}
            className={`rounded-full border px-5 py-3 text-xs font-bold uppercase tracking-[.12em] transition ${category === value ? "border-ink bg-ink text-white" : "border-border bg-canvas text-ink hover:border-ink"}`}>
            {t(value)}
          </button>
        ))}
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((article) => <NewsCard key={article.slug} item={article} />)}
      </div>
      {visible.length === 0 && <p className="rounded-3xl border border-border bg-surface px-6 py-12 text-center text-muted">{t("empty")}</p>}
    </>
  );
}
