import "server-only";
import fixtures from "@/data/fixtures/activities.json";
import { env } from "@/config/env";
import { request } from "./client";
import { localizeFixture } from "./fixtures";
import { validateCollection } from "@/models/validate";

/** @param {{locale: 'ka'|'en'}} options @returns {Promise<import('@/models/content').Activity[]>} */
export async function getActivities({ locale }) {
  const items =
    env.dataSource === "api"
      ? await request("activities", { locale })
      : await localizeFixture(fixtures, locale);
  validateCollection("activities", items);
  return items;
}
