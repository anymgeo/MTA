import "server-only";
import fixtures from "@/data/fixtures/portal.json";
import { env } from "@/config/env";
import { request } from "./client";
import { localizeFixture } from "./fixtures";
import { validatePortal, matchesArea, activeAt } from "@/models/portal";
/** @returns {Promise<import('@/models/portal').PortalRecord[]>} */
export async function getPortalRecords(kind, { locale, area } = {}) {
  if (!Object.hasOwn(fixtures, kind))
    throw new Error("Unknown content collection");
  const records =
    env.dataSource === "api"
      ? await request(kind, {
          locale,
          revalidate: ["closures", "avalanches", "resortOperations"].includes(
            kind,
          )
            ? 0
            : 300,
        })
      : await localizeFixture(fixtures[kind], locale);
  const result = validatePortal(records).filter((item) =>
    matchesArea(item, area),
  );
  return kind === "documents"
    ? result.sort(
        (a, b) =>
          (a.category || "").localeCompare(b.category || "") ||
          (b.publishedAt || "").localeCompare(a.publishedAt || ""),
      )
    : result;
}
export async function getPortalRecord(kind, slug, options) {
  return (
    (await getPortalRecords(kind, options)).find(
      (item) => item.slug === slug,
    ) || null
  );
}
export const getSafetyRules = (options) =>
  getPortalRecord("safety", "code-of-conduct", options);
export const getPisteClassification = (options) =>
  getPortalRecord("safety", "piste-classification", options);
export const getEmergencyContacts = (options) =>
  getPortalRecords("contacts", options);
export async function getClosures(options = {}) {
  const items = await getPortalRecords("closures", options);
  return options.activeOnly ? items.filter((item) => activeAt(item)) : items;
}
export const getAvalancheWarnings = (options) =>
  getPortalRecords("avalanches", options);
export const getEvents = (options) => getPortalRecords("events", options);
export const getLeadership = (options) =>
  getPortalRecords("leadership", options);
export const getInfrastructure = (options) =>
  getPortalRecords("infrastructure", options);
export const getDocuments = (options) => getPortalRecords("documents", options);
export const getWebcams = (options) => getPortalRecords("webcams", options);
