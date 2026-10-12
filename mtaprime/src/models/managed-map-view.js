import {pathData,MAP_COLORS} from '../../../shared/map-geometry.mjs';
export const mapAnchor = value => Array.isArray(value)
  ? { x: value[0], y: value[1], inX: value[2], inY: value[3], outX: value[4], outY: value[5] }
  : value;

// Preserve the editor's cubic handles and closed geometry in the original viewer.
export function mapPath(points = [], closed = false) {
  return pathData(points.map(p=>{const a=mapAnchor(p);return [a.x,a.y,a.inX??a.x,a.inY??a.y,a.outX??a.x,a.outY??a.y];}),closed);
}

export function managedMapView(map) {
  const records = (map.features || []).map(feature => {
    const point = feature.points?.length ? mapAnchor(feature.points[0]) : null;
    const type = map.types.find(item => item.key === feature.kind);
    const kind = ["expert-trail", "ski-way"].includes(feature.kind) ? "trail" : feature.kind === "official-hazard" ? "warning" : ["snowpark", "beginner-area"].includes(feature.kind) ? "zone" : ["lift", "trail", "warning", "poi", "label", "zone"].includes(feature.kind) ? feature.kind : "poi";
    const reference = feature.description?.startsWith("official-trace:gudauri-v1:");
    return { ...feature, kind, type: type?.name, position: point && { x: point.x, y: point.y },
      reference, description: reference ? feature.description.split("\n").slice(1).join("\n") : feature.description,
      sourceKind: feature.kind, dashed: feature.kind === "ski-way", difficulty: feature.kind === "expert-trail" ? "black" : feature.difficulty,
      routeColor: feature.kind === "trail" ? MAP_COLORS[feature.difficulty] : MAP_COLORS[feature.kind] || type?.color,
      hours: feature.opens && feature.closes ? `${feature.opens}–${feature.closes}` : undefined,
      path: feature.geometryKind !== "point" ? mapPath(feature.points, feature.geometryKind === "polygon") : undefined,
      closedGeometry: feature.geometryKind === "polygon", color: type?.color };
  });
  // Catalog entries without coordinates remain in the information list, never invented pins.
  for (const item of map.catalogRecords || []) {
    if (!records.some(record => record.kind === item.kind && record.name === item.name)) records.push(item);
  }
  return { ...map, verified: Boolean(map.verified && map.features?.length), records };
}
