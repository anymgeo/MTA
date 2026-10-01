import "server-only";
import { validateCollection } from "@/models/validate";
import { getCmsRecords } from './cms';

/** @param {{locale: 'ka'|'en'}} options @returns {Promise<import('@/models/content').Project[]>} */
export async function getProjects({ locale }) {
  const items = await getCmsRecords('projects', locale);
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
