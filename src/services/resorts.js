import "server-only";
import fixtures from "@/data/fixtures/resorts.json";
import { env } from "@/config/env";
import { request } from "./client";
import { localizeFixture } from "./fixtures";
import { validateCollection } from "@/models/validate";
import { getTranslations } from "next-intl/server";
/** @param {{locale: 'ka'|'en'}} options @returns {Promise<import('@/models/content').Resort[]>} */
export async function getResorts({ locale }) {
  const items =
    env.resortsDataSource === "api"
      ? await request("resorts", { locale, revalidate: 0 })
      : await localizeFixture(fixtures, locale);
  validateCollection("resorts", items);
  const t = await getTranslations({ locale, namespace: "Common" });
  return items.map((item) => ({
    ...item,
    statusLabel: t(item.status.toLowerCase()),
    seasons: item.seasons ?? { winter: { image: item.image, heroImages: item.heroImages }, summer: { image: item.summerImage, heroImages: [item.summerImage] } },
  }));
}
/** @returns {Promise<import('@/models/content').Resort|null>} */
export async function getResortBySlug(slug, { locale }) {
  return (
    (await getResorts({ locale })).find((item) => item.slug === slug) || null
  );
}
export async function getResortsSlugs() {
  return (await getResorts({ locale: "en" })).map((item) => ({
    slug: item.slug,
  }));
}
export async function getResortBuildParams() {
  return env.resortsDataSource === "api" ? [] : getResortsSlugs();
}
