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
  return feeds
    .filter(feed => feed.status !== 'inactive' && (!area || matchesArea(feed, area)))
    .map((feed) => {
      const resort = resorts.find(r => r.slug === feed.areaId);
      return {
        id: feed.id,
        slug: feed.slug,
        name: feed.title,
        location: feed.area || resort?.region || feed.title,
        image: feed.image || resort?.image || '/Gudauri.jpg',
        seasonImages: feed.image ? null : resort?.seasons,
        resortSlug: feed.areaId,
        sourceType: feed.sourceType || 'embed',
        videoUrl: feed?.videoUrl || null,
        sourceUrl:
          feed?.links?.find((l) => l.url.includes("youtube.com/watch"))?.url ||
          null,
        status: feed?.videoUrl
          ? feed.status === "live" || feed.isLive
            ? "live"
            : "recorded"
          : "unavailable",
        updatedAt: feed?.updatedAt || null,
      };
    });
}
export async function getWebcamView(slug, options) {
  return (await getWebcamViews(options)).find((c) => c.slug === slug || c.resortSlug === slug) || null;
}
