import { useTranslations } from "next-intl";

const validCategories = new Set(["news", "article", "blog"]);

export default function NewsCategoryTag({ category, className = "" }) {
  const t = useTranslations("NewsCategories");
  const value = validCategories.has(category) ? category : "news";
  return (
    <span className={`inline-flex w-fit rounded-full border border-ink/15 bg-canvas/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-ink ${className}`}>
      {t(value)}
    </span>
  );
}
