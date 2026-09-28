import { activeAt, matchesArea } from "./portal.js";
export function mapPosition(record, map) {
  const p = record.mapPosition;
  return (p?.verified === true ||
    (map.demo === true && record.demo === true && p?.verified === false)) &&
    p.mapId === map.id &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    p.x >= 0 &&
    p.x <= map.width &&
    p.y >= 0 &&
    p.y <= map.height
    ? { x: p.x, y: p.y }
    : null;
}
/** Route endpoints share the exact source-image coordinate contract of mapPosition. */
export function routePoints(record, map) {
  if (!record.startPoint && !record.endPoint) return undefined;
  const start = mapPosition({ ...record, mapPosition: record.startPoint }, map);
  const end = mapPosition({ ...record, mapPosition: record.endPoint }, map);
  if (!start || !end) return undefined;
  return [
    [start.x, start.y],
    [end.x, end.y],
  ];
}
/** Join live operations and shared safety records; never assign guessed coordinates. */
export function assembleMapRecords({
  map,
  resort,
  operations,
  closures = [],
  avalanches = [],
  now = new Date(),
}) {
  const records = [];
  for (const [kind, items] of [
    ["lift", operations?.lifts || resort.page?.liftList || resort.liftList || []],
    ["trail", operations?.trails || resort.page?.trailList || []],
  ])
    for (const [i, r] of items.entries())
      records.push({
        ...r,
        id: kind + ":" + (r.id || i),
        kind,
        name: r.name,
        position:
          mapPosition(r, map) ||
          mapPosition({ ...r, mapPosition: r.startPoint }, map),
        points: routePoints(r, map),
        catalog: !operations,
        status: operations ? r.status : null,
      });
  for (const [source, items] of [
    ["closures", closures],
    ["avalanche-danger", avalanches],
  ])
    for (const r of items.filter(
      (r) => matchesArea(r, resort.slug) && activeAt(r, now),
    ))
      records.push({
        ...r,
        id: source + ":" + r.id,
        kind: "warning",
        name: r.title,
        position: mapPosition(r, map),
        href: r.demo ? undefined : "/safety/" + source + "/" + r.slug,
      });
  for (const f of map.verified ? map.features : []) {
    const record = records.find(
      (r) => r.kind === f.kind && r.id === f.kind + ":" + f.recordId,
    );
    if (record) {
      record.position = { x: f.points[0][0], y: f.points[0][1] };
      record.points = f.points;
    } else
      records.push({
        ...f,
        id: "geometry:" + f.id,
        position: { x: f.points[0][0], y: f.points[0][1] },
      });
  }
  return records;
}
export function clampView(view, size, map) {
  const base = Math.min(size.width / map.width, size.height / map.height),
    z = Math.max(1, Math.min(8, view.z)),
    w = map.width * base * z,
    h = map.height * base * z;
  return {
    z,
    x:
      w <= size.width
        ? (size.width - w) / 2
        : Math.max(size.width - w, Math.min(0, view.x)),
    y:
      h <= size.height
        ? (size.height - h) / 2
        : Math.max(size.height - h, Math.min(0, view.y)),
  };
}
export function zoomView(view, factor, anchor, size, map) {
  const z = Math.max(1, Math.min(8, view.z * factor)),
    ratio = z / view.z;
  return clampView(
    {
      z,
      x: anchor.x - (anchor.x - view.x) * ratio,
      y: anchor.y - (anchor.y - view.y) * ratio,
    },
    size,
    map,
  );
}

/** @typedef {{id:string,kind:'trail'|'lift'|'warning',areaId?:string,name:string,description?:string,status?:string,difficulty?:string,hours?:string,type?:string,demo?:boolean,position:{x:number,y:number}|null}} MapRecord */
export function validateMapRecords(records, map) {
  const ids = new Set();
  for (const r of records) {
    if (
      !r.id ||
      ids.has(r.id) ||
      typeof r.name !== "string" ||
      !["trail", "lift", "warning", "poi", "label", "zone"].includes(r.kind)
    )
      throw new Error("Invalid map record");
    ids.add(r.id);
    if (
      r.position &&
      (![r.position.x, r.position.y].every(Number.isFinite) ||
        r.position.x < 0 ||
        r.position.x > map.width ||
        r.position.y < 0 ||
        r.position.y > map.height)
    )
      throw new Error("Invalid map position");
  }
  return records;
}
