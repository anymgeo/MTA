import { useTranslations } from "next-intl";

const validCategories = new Set(["news", "blog"]);

export default function NewsCategoryTag({ category, className = "" }) {
  const t = useTranslations("NewsCategories");
  const value = category === "article" ? "blog" : validCategories.has(category) ? category : "news";
  return (
    <span data-news-category={value} className={`news-category-tag inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${className}`}>
      {t(value)}
    </span>
  );
}
