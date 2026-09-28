const required = {
  resorts: [
    "slug",
    "name",
    "region",
    "description",
    "image",
    "summerImage",
    "status",
    "lifts",
    "trails",
    "temp",
    "snow",
    "newSnow",
    "wind",
    "hours",
    "elevation",
    "highestPoint",
    "pistes",
    "winterSeason",
  ],
  news: ["slug", "title", "date", "image", "excerpt"],
  projects: [
    "slug",
    "title",
    "resort",
    "resortId",
    "category",
    "image",
    "date",
    "description",
    "overview",
  ],
  activities: ["title", "description", "image"],
};
function assert(condition, message) {
  if (!condition) throw new Error("Invalid content: " + message);
}
function strings(value, name) {
  assert(
    Array.isArray(value) && value.every((x) => typeof x === "string"),
    name,
  );
}
export function validateCollection(kind, items) {
  assert(Array.isArray(items), kind + " must be an array");
  const slugs = new Set();
  for (const item of items) {
    assert(item && typeof item === "object", kind + " record");
    assert(["string", "number"].includes(typeof item.id), kind + " id");
    for (const key of required[kind])
      assert(typeof item[key] === "string", kind + "." + key);
    if (item.slug) {
      assert(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) && !slugs.has(item.slug),
        "unique stable slug",
      );
      slugs.add(item.slug);
    }
    if (kind === "resorts") {
      assert(
        ["OPEN", "LIMITED", "CLOSED"].includes(item.status),
        "resort status",
      );
      strings(item.heroImages, "heroImages");
      if (item.seasons) for (const season of ["winter", "summer"]) {
        assert(typeof item.seasons[season]?.image === "string", "season image");
        strings(item.seasons[season]?.heroImages, "season hero images");
        assert(item.seasons[season].heroImages.length > 0, "nonempty season hero images");
      }
      strings(item.gallery, "gallery");
      assert(
        Array.isArray(item.liftList) &&
          item.liftList.every((lift) =>
            ["name", "type", "hours"].every((k) => typeof lift[k] === "string"),
          ),
        "liftList",
      );
      assert(
        Array.isArray(item.trailDifficulty) &&
          item.trailDifficulty.every(
            (trail) =>
              typeof trail.label === "string" &&
              typeof trail.description === "string" &&
              typeof trail.value === "number",
          ),
        "trailDifficulty",
      );
      for (const season of ["winter", "summer"])
        assert(
          Array.isArray(item.experience?.[season]) &&
            item.experience[season].every((x) =>
              ["title", "text", "iconKey"].every(
                (k) => typeof x[k] === "string",
              ),
            ),
          "experience." + season,
        );
      assert(
        item.transport &&
          ["car", "transfer", "routeUrl"].every(
            (k) => typeof item.transport[k] === "string",
          ),
        "transport",
      );
    }
    if (kind === "news" || kind === "projects")
      assert(
        /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
          !Number.isNaN(Date.parse(item.date)),
        "ISO date",
      );
    if (kind === "news") {
      assert(["news", "article", "blog"].includes(item.category), "category");
      strings(item.content, "content");
      strings(item.gallery, "gallery");
    }
    if (kind === "projects") {
      assert(Number.isInteger(item.year), "year");
      strings(item.activities, "activities");
      strings(item.highlights, "highlights");
      assert(
        Array.isArray(item.stats) &&
          item.stats.every(
            (x) => typeof x.value === "string" && typeof x.label === "string",
          ),
        "stats",
      );
    }
    if (kind === "activities")
      assert(
        Array.isArray(item.seasons) &&
          item.seasons.every((s) => ["winter", "summer"].includes(s)),
        "seasons",
      );
  }
  return items;
}
