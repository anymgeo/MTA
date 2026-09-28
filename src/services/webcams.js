import "server-only";
import { getResorts } from "./resorts";
import { getPortalRecords } from "./portal";
import { matchesArea } from "@/models/portal";
/** Camera views join existing resort imagery with the available feed records.
 * A preview never inherits simulated weather or a live label from resort fixtures. */
export async function getWebcamViews({ locale, area } = {}) {
  const [resorts, feeds] = await Promise.all([
    getResorts({ locale }),
    getPortalRecords("webcams", { locale }),
  ]);
  return resorts
    .filter((r) => !area || matchesArea({ areaId: r.slug }, area))
    .map((resort) => {
      const feed = feeds.find((f) => f.areaId === resort.slug);
      return {
        id: resort.slug,
        slug: resort.slug,
        name: resort.name,
        location: resort.region || resort.name,
        image: resort.image,
        seasonImages: resort.seasons,
        resortSlug: resort.slug,
        videoUrl: feed?.videoUrl || null,
        sourceUrl:
          feed?.links?.find((l) => l.url.includes("youtube.com/watch"))?.url ||
          null,
        status: feed?.videoUrl
          ? feed.status === "live"
            ? "live"
            : "recorded"
          : "unavailable",
        updatedAt: feed?.updatedAt || null,
      };
    });
}
export async function getWebcamView(slug, options) {
  return (await getWebcamViews(options)).find((c) => c.slug === slug) || null;
}
