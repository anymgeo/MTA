import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assembleMapRecords,
  mapPosition,
  validateMapRecords,
} from "../src/models/map-records.js";
const read = (p) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const maps = read("../src/data/fixtures/trail-maps.json");
const mocks = read("../src/data/mocks/map-operations.json");
// Substitute readable strings for message references without loading a Next.js request.
const localize = (x) =>
  JSON.parse(JSON.stringify(x), (_, v) => (v?.$message ? v.$message : v));
for (const area of ["gudauri", "kobi", "goderdzi"])
  test(
    area +
      " demo supplies every marker type with valid source-image coordinates",
    () => {
      const slug = area === "goderdzi" ? area : "gudauri-kobi",
        map = maps[slug],
        source = localize(mocks[area]);
      const records = assembleMapRecords({
        map,
        resort: { slug, liftList: [] },
        operations: source,
        closures: source.closures,
        avalanches: source.avalanches,
      });
      assert.equal(validateMapRecords(records, map).length, 6);
      for (const kind of ["trail", "lift", "warning"])
        assert.equal(records.filter((r) => r.kind === kind).length, 2);
      assert.ok(
        records.every((r) => r.position && r.areaId === area && r.demo),
      );
      assert.ok(
        records.filter((r) => r.kind === "warning").every((r) => !r.href),
      );
      const r = source.lifts[0];
      assert.equal(
        mapPosition(r, { ...map, demo: false }),
        null,
        "API mode must not accept demo coordinates",
      );
      assert.equal(
        mapPosition({ ...r, demo: false }, map),
        null,
        "Map demo flag alone must not allow unverified records",
      );
    },
  );
test("Goderdzi data never leaks into the combined Gudauri/Kobi safety records", () => {
  const source = localize(mocks.goderdzi);
  const records = assembleMapRecords({
    map: maps["gudauri-kobi"],
    resort: { slug: "gudauri-kobi", liftList: [] },
    closures: source.closures,
    avalanches: source.avalanches,
  });
  assert.deepEqual(records, []);
});
