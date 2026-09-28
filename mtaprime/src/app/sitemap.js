import { getWebcamViews } from "@/services/webcams";
import { getPortalRecords } from "@/services/portal";
import { env } from "@/config/env";
import { getResortsSlugs } from "@/services/resorts";
import { getNewsSlugs } from "@/services/news";
import { getProjectsSlugs } from "@/services/projects";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const [resorts, news, projects] = await Promise.all([
    getResortsSlugs(),
    getNewsSlugs(),
    getProjectsSlugs(),
  ]);
  const portalKinds = [
    "safety",
    "closures",
    "avalanches",
    "events",
    "leadership",
    "infrastructure",
  ];
  const portalItems = await Promise.all(
    portalKinds.map((kind) => getPortalRecords(kind, { locale: "en" })),
  );
  const prefixes = [
    "/safety/",
    "/safety/closures/",
    "/safety/avalanche-danger/",
    "/events/",
    "/about/leadership/",
    "/about/infrastructure/",
  ];
  const extraPaths = portalItems.flatMap((items, i) =>
    items.map((item) => prefixes[i] + item.slug),
  );
  const cameras = await getWebcamViews({ locale: "en" });
  const paths = [
    ...cameras.map((c) => "/webcams/" + c.slug),
    "/events",
    "/events/competitions",
    "/about/history",
    "/about/leadership",
    "/about/infrastructure",
    "/about/documents",
    "/webcams",
    ...extraPaths,
    "",
    "/about",
    "/contact",
    "/faq",
    "/news",
    "/projects",
    "/resorts",
    "/safety",
    "/structure",
    ...resorts.flatMap(({ slug }) =>
      ["", "/maps", "/activities"].map((s) => "/resorts/" + slug + s),
    ),
    ...news.map(({ slug }) => "/news/" + slug),
    ...projects.map(({ slug }) => "/projects/" + slug),
  ];
  return paths.flatMap((path) =>
    ["ka", "en"].map((locale) => ({
      url: env.siteUrl + "/" + locale + path,
      alternates: {
        languages: {
          ka: env.siteUrl + "/ka" + path,
          en: env.siteUrl + "/en" + path,
        },
      },
    })),
  );
}
