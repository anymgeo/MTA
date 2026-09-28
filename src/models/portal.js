/**
 * @typedef {{name:string,url:string,mimeType:'application/pdf',id?:string}} PdfFile
 * @typedef {{title:string,text:string}} ContentBlock
 * @typedef {{id:string,slug:string,title:string,description:string,areaId?:string,
 * area?:string,category?:string,type?:string,status?:string,startAt?:string|null,
 * endAt?:string|null,publishedAt?:string|null,updatedAt?:string|null,image?:string,
 * images?:string[],blocks?:ContentBlock[],links?:{label:string,url:string}[],files?:PdfFile[],
 * mapUrl?:string,videoUrl?:string,phone?:string,position?:string,
 * schedule?:ContentBlock[],participants?:ContentBlock[],changes?:ContentBlock[],
 * results?:ContentBlock[],media?:ContentBlock[],specs?:{label:string,value:string}[]}} PortalRecord
 */
export function safeUrl(value) {
  return (
    typeof value === "string" &&
    (/^\/(?!\/)/.test(value) || /^https:\/\//.test(value))
  );
}
export function validatePortal(items) {
  if (!Array.isArray(items)) throw new Error("Expected content collection");
  const slugs = new Set();
  for (const item of items) {
    if (
      !item ||
      !["id", "slug", "title", "description"].every(
        (k) => typeof item[k] === "string",
      ) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
      slugs.has(item.slug)
    )
      throw new Error("Invalid content record");
    slugs.add(item.slug);
    for (const key of ["startAt", "endAt", "updatedAt", "publishedAt"])
      if (item[key] && !Number.isFinite(Date.parse(item[key])))
        throw new Error("Invalid date");
    if (
      item.startAt &&
      item.endAt &&
      Date.parse(item.endAt) < Date.parse(item.startAt)
    )
      throw new Error("Invalid date range");
    for (const key of ["image", "mapUrl", "videoUrl", "href", "purchaseUrl"])
      if (item[key] && !safeUrl(item[key])) throw new Error("Invalid URL");
    if (
      item.images &&
      (!Array.isArray(item.images) || item.images.some((url) => !safeUrl(url)))
    )
      throw new Error("Invalid images");
    for (const link of item.links || [])
      if (!safeUrl(link.url) || typeof link.label !== "string")
        throw new Error("Invalid link");
    for (const file of item.files || [])
      if (
        file.mimeType !== "application/pdf" ||
        !safeUrl(file.url) ||
        !file.name ||
        !new URL(file.url, "https://mta.ski").pathname
          .toLowerCase()
          .endsWith(".pdf")
      )
        throw new Error("PDF files only");
    for (const key of [
      "blocks",
      "schedule",
      "participants",
      "changes",
      "results",
      "media",
    ])
      if (
        item[key] &&
        (!Array.isArray(item[key]) ||
          item[key].some(
            (b) => typeof b.title !== "string" || typeof b.text !== "string",
          ))
      )
        throw new Error("Invalid text blocks");
  }
  return items;
}
export function matchesArea(item, area) {
  return (
    !area ||
    item.areaId === "all" ||
    item.areaId === area ||
    (["gudauri", "kobi"].includes(area) && item.areaId === "gudauri-kobi") ||
    (area === "gudauri-kobi" && ["gudauri", "kobi"].includes(item.areaId))
  );
}
export function activeAt(item, now = new Date()) {
  return (
    item.status === "active" &&
    (!item.startAt || Date.parse(item.startAt) <= +now) &&
    (!item.endAt || Date.parse(item.endAt) >= +now)
  );
}
export function filterRecords(
  items,
  {
    area = "",
    category = "",
    date = "",
    year = "",
    status = "",
    type = "",
  } = {},
) {
  return items.filter(
    (item) =>
      (!area || matchesArea(item, area)) &&
      (!category || item.category === category) &&
      (!type || item.type === type) &&
      (!status || item.status === status) &&
      (!year || (item.publishedAt || item.startAt || "").startsWith(year)) &&
      (!date ||
        ((item.startAt || "").slice(0, 10) <= date &&
          (item.endAt || item.startAt || "").slice(0, 10) >= date)),
  );
}
