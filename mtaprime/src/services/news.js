import "server-only";
import fixtures from "@/data/fixtures/news.json";
import { env } from "@/config/env";
import { request } from "./client";
import { localizeFixture } from "./fixtures";
import { validateCollection } from "@/models/validate";

/** @param {{locale: 'ka'|'en'}} options @returns {Promise<import('@/models/content').NewsArticle[]>} */
export async function getNews({ locale }) {
  const items =
    env.newsDataSource === "api"
      ? await request("news", { locale, revalidate: 0 })
      : await localizeFixture(fixtures, locale);
  const normalized = items.map((item) => ({ ...item, category: item.category || "news" }));
  validateCollection("news", normalized);
  return normalized;
}
/** @returns {Promise<import('@/models/content').NewsArticle|null>} */
export async function getNewsArticleBySlug(slug, { locale }) {
  if (env.newsDataSource === "api") {
    const item = await request("news/" + encodeURIComponent(slug), { locale, revalidate: 0 });
    const normalized = item ? { ...item, category: item.category || "news" } : null;
    if (normalized) validateCollection("news", [normalized]);
    return normalized;
  }
  return (await getNews({ locale })).find((item) => item.slug === slug) || null;
}
export async function getNewsSlugs() {
  return (await getNews({ locale: "en" })).map((item) => ({ slug: item.slug }));
}
