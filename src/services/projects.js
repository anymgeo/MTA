import "server-only";
import fixtures from "@/data/fixtures/projects.json";
import { env } from "@/config/env";
import { request } from "./client";
import { localizeFixture } from "./fixtures";
import { validateCollection } from "@/models/validate";

/** @param {{locale: 'ka'|'en'}} options @returns {Promise<import('@/models/content').Project[]>} */
export async function getProjects({ locale }) {
  const items =
    env.dataSource === "api"
      ? await request("projects", { locale })
      : await localizeFixture(fixtures, locale);
  validateCollection("projects", items);
  return items.map((item) => ({
    ...item,
    status: item.status || "unknown",
    startAt: item.startAt || null,
    endAt: item.endAt || null,
    files: item.files || [],
    links: item.links || [],
  }));
}
/** @returns {Promise<import('@/models/content').Project|null>} */
export async function getProjectBySlug(slug, { locale }) {
  return (
    (await getProjects({ locale })).find((item) => item.slug === slug) || null
  );
}
export async function getProjectsSlugs() {
  return (await getProjects({ locale: "en" })).map((item) => ({
    slug: item.slug,
  }));
}
