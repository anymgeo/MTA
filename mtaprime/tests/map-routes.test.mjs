import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routePoints } from "../src/models/map-records.js";
const json = (p) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const maps = json("../src/data/fixtures/trail-maps.json");
const mocks = json("../src/data/mocks/map-operations.json");
test("Every demo lift and piste supplies valid distinct route endpoints", () => {
  for (const [area, data] of Object.entries(mocks))
    for (const r of [...data.lifts, ...data.trails]) {
      const map = maps[area === "goderdzi" ? area : "gudauri-kobi"];
      const points = routePoints(r, map);
      assert.equal(points.length, 2);
      assert.notDeepEqual(points[0], points[1]);
      assert.deepEqual(points[0], [r.startPoint.x, r.startPoint.y]);
      assert.deepEqual(points[1], [r.endPoint.x, r.endPoint.y]);
    }
});
test("API route coordinates must belong to the same map and be verified and in bounds", () => {
  const r = mocks.gudauri.lifts[0],
    map = { ...maps["gudauri-kobi"], demo: false };
  assert.equal(routePoints(r, map), undefined);
  const valid = {
    ...r,
    demo: false,
    startPoint: { ...r.startPoint, verified: true },
    endPoint: { ...r.endPoint, verified: true },
  };
  assert.equal(routePoints(valid, map).length, 2);
  assert.equal(
    routePoints(
      { ...valid, endPoint: { ...valid.endPoint, mapId: "goderdzi" } },
      map,
    ),
    undefined,
  );
  assert.equal(
    routePoints({ ...valid, endPoint: { ...valid.endPoint, x: -1 } }, map),
    undefined,
  );
  assert.equal(routePoints({ ...valid, endPoint: null }, map), undefined);
});
