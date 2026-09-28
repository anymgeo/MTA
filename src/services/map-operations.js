import "server-only";
import mocks from "@/data/mocks/map-operations.json";
import { env } from "@/config/env";
import { localizeFixture } from "./fixtures";
import { getPortalRecords, getClosures, getAvalancheWarnings } from "./portal";
/** Same operations/closure contract in fixture and API modes. Mock safety records stay map-only. */
export async function getMapOperations(slug, { locale }) {
  if (env.dataSource === "fixtures") {
    const areas = slug === "gudauri-kobi" ? ["gudauri", "kobi"] : [slug];
    const source = areas.map((area) => mocks[area]).filter(Boolean);
    if (source.length)
      return localizeFixture(
        {
          demo: true,
          operations: {
            lifts: source.flatMap((x) => x.lifts),
            trails: source.flatMap((x) => x.trails),
          },
          closures: source.flatMap((x) => x.closures),
          avalanches: source.flatMap((x) => x.avalanches),
        },
        locale,
      );
  }
  const [operations, closures, avalanches] = await Promise.all([
    getPortalRecords("resortOperations", { locale, area: slug }),
    getClosures({ locale, area: slug, activeOnly: true }),
    getAvalancheWarnings({ locale, area: slug }),
  ]);
  return { demo: false, operations: operations[0], closures, avalanches };
}
