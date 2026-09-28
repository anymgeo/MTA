/** @typedef {{id:string,kind:'trail'|'lift'|'poi'|'label'|'zone',name:string,description?:string,difficulty?:'green'|'blue'|'red'|'black',status?:string,type?:string,points:[number,number][]}} MapFeature
 * @typedef {{id:string,image:string,width:number,height:number,verified:boolean,features:MapFeature[]}} TrailMap */
export function validateTrailMap(map) {
  if (
    !map ||
    !map.id ||
    !/^\/(?!\/)/.test(map.image) ||
    !Number.isFinite(map.width) ||
    map.width <= 0 ||
    !Number.isFinite(map.height) ||
    map.height <= 0 ||
    !Array.isArray(map.features)
  )
    throw new Error("Invalid map");
  const ids = new Set();
  for (const f of map.features) {
    if (
      !f.id ||
      ids.has(f.id) ||
      !["trail", "lift", "poi", "label", "zone"].includes(f.kind) ||
      !f.name ||
      !Array.isArray(f.points) ||
      f.points.length <
        (["poi", "label"].includes(f.kind) ? 1 : f.kind === "zone" ? 3 : 2) ||
      f.points.some(
        (p) =>
          !Array.isArray(p) ||
          p.length !== 2 ||
          p.some((v) => !Number.isFinite(v)) ||
          p[0] < 0 ||
          p[0] > map.width ||
          p[1] < 0 ||
          p[1] > map.height,
      )
    )
      throw new Error("Invalid map feature");
    ids.add(f.id);
    if (
      f.difficulty &&
      !["green", "blue", "red", "black"].includes(f.difficulty)
    )
      throw new Error("Invalid difficulty");
  }
  return map;
}
