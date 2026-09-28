import "server-only";
import fixtures from "@/data/fixtures/trail-maps.json";
import { env } from "@/config/env";
import { request } from "./client";
import { localizeFixture } from "./fixtures";
import { validateTrailMap } from "@/models/trail-map";
import { getResortBySlug } from "./resorts";
import { getMapOperations } from "./map-operations";
import { assembleMapRecords, validateMapRecords } from "@/models/map-records";
export async function getTrailMap(slug, { locale }) {
  const resort = await getResortBySlug(slug, { locale });
  if (!resort) return null;
  const map =
    env.dataSource === "api"
      ? await request("maps/" + slug, { locale, revalidate: 300 })
      : await localizeFixture(
          fixtures[slug] || {
            id: slug,
            image: resort.image,
            width: 1600,
            height: 1000,
            verified: false,
            features: [],
          },
          locale,
        );
  validateTrailMap(map);
  const source = await getMapOperations(slug, { locale });
  const result = { ...map, demo: source.demo };
  const records = assembleMapRecords({ map: result, resort, ...source });
  validateMapRecords(records, result);
  return { ...result, records };
}
