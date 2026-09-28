import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTranslator } from "next-intl";
import { validateCollection } from "../src/models/validate.js";

const json = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const catalogs = {
  en: json("../messages/en.json"),
  ka: json("../messages/ka.json"),
};
function flatten(value, prefix = "") {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === "string"
      ? [[prefix + key, item]]
      : flatten(item, prefix + key + "."),
  );
}
function localize(value, t) {
  if (Array.isArray(value)) return value.map((item) => localize(item, t));
  if (value && typeof value === "object")
    return value.$message
      ? t(value.$message)
      : Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, localize(item, t)]),
        );
  return value;
}

test("Both locales have the same complete message keys and valid ICU messages", () => {
  const english = flatten(catalogs.en),
    georgian = flatten(catalogs.ka);
  assert.deepEqual(
    english.map(([key]) => key).sort(),
    georgian.map(([key]) => key).sort(),
  );
  for (const [locale, messages] of Object.entries(catalogs)) {
    const t = createTranslator({
      locale,
      messages,
      onError: (error) => {
        throw error;
      },
    });
    for (const [key, message] of flatten(messages)) {
      assert.ok(message.trim(), key);
      const values = Object.fromEntries(
        [...message.matchAll(/\{(\w+)(?:\}|,\s*(plural|selectordinal|number|date|time|select))/g)].map(([, name, format]) => [name, format && format !== "select" ? 2 : "test"]),
      );
      assert.equal(typeof t(key, values), "string", key);
    }
  }
});

test("All fixtures resolve and satisfy the API model in each locale", () => {
  for (const [locale, messages] of Object.entries(catalogs)) {
    const t = createTranslator({
      locale,
      messages,
      onError: (error) => {
        throw error;
      },
    });
    for (const kind of ["resorts", "news", "projects", "activities"]) {
      const records = localize(
        json("../src/data/fixtures/" + kind + ".json"),
        t,
      );
      validateCollection(kind, records);
      assert.ok(records.length > 0, kind);
      if (locale === "ka")
        for (const record of records)
          assert.match(record.name || record.title, /[\u10a0-\u10ff]/);
    }
  }
});

test("Runtime boundary rejects malformed content instead of rendering partial records", () => {
  const t = createTranslator({ locale: "en", messages: catalogs.en });
  const resorts = localize(json("../src/data/fixtures/resorts.json"), t);
  assert.throws(() => validateCollection("resorts", null));
  assert.throws(() => validateCollection("resorts", [resorts[0], resorts[0]]));
  assert.throws(() =>
    validateCollection("resorts", [{ ...resorts[0], status: "unknown" }]),
  );
  assert.throws(() =>
    validateCollection("resorts", [
      { ...resorts[0], experience: { winter: [], summer: null } },
    ]),
  );
  assert.throws(() =>
    validateCollection("activities", [
      {
        id: 1,
        title: "A",
        description: "B",
        image: "/a.jpg",
        seasons: ["autumn"],
      },
    ]),
  );
});

test("Stable resort, season and icon identifiers are independent of translated text", () => {
  const records = (locale) =>
    localize(
      json("../src/data/fixtures/resorts.json"),
      createTranslator({ locale, messages: catalogs[locale] }),
    );
  assert.deepEqual(
    records("en").map((x) => [
      x.id,
      x.slug,
      x.status,
      x.experience.winter.map((a) => a.iconKey),
    ]),
    records("ka").map((x) => [
      x.id,
      x.slug,
      x.status,
      x.experience.winter.map((a) => a.iconKey),
    ]),
  );
});

import {
  validatePortal,
  filterRecords,
  matchesArea,
  activeAt,
} from "../src/models/portal.js";
test("Portal content resolves in both languages and validates", () => {
  for (const [locale, messages] of Object.entries(catalogs)) {
    const t = createTranslator({
      locale,
      messages,
      onError: (e) => {
        throw e;
      },
    });
    for (const records of Object.values(
      json("../src/data/fixtures/portal.json"),
    ))
      validatePortal(localize(records, t));
  }
});
test("Area matching and current restriction boundaries are shared and inclusive", () => {
  assert.ok(matchesArea({ areaId: "gudauri-kobi" }, "kobi"));
  assert.ok(matchesArea({ areaId: "all" }, "gudauri-kobi"));
  assert.equal(matchesArea({ areaId: "mestia" }, "kobi"), false);
  const r = {
    status: "active",
    startAt: "2026-09-18T08:00:00Z",
    endAt: "2026-09-18T12:00:00Z",
  };
  assert.ok(activeAt(r, new Date(r.startAt)));
  assert.ok(activeAt(r, new Date(r.endAt)));
  assert.equal(activeAt(r, new Date("2026-09-19")), false);
  assert.equal(filterRecords([r], { date: "2026-09-18" }).length, 1);
  assert.equal(filterRecords([r], { date: "2026-09-19" }).length, 0);
});
test("Portal boundary rejects unsafe links, duplicate slugs and reversed dates", () => {
  const r = { id: "1", slug: "sample", title: "Sample", description: "Text" };
  assert.throws(() => validatePortal([r, r]));
  assert.throws(() => validatePortal([{ ...r, href: "javascript:alert(1)" }]));
  assert.throws(() =>
    validatePortal([
      {
        ...r,
        files: [{ name: "Bad", url: "/bad.html", mimeType: "application/pdf" }],
      },
    ]),
  );
  assert.throws(() =>
    validatePortal([{ ...r, startAt: "2026-09-19", endAt: "2026-09-18" }]),
  );
});

import { validateTrailMap } from "../src/models/trail-map.js";
test("Map geometry stays inside its image coordinate system", () => {
  const map = json("../src/data/fixtures/trail-maps.json")["gudauri-kobi"];
  assert.equal(validateTrailMap(map), map);
  const f = {
    id: "test",
    kind: "trail",
    name: "Test",
    points: [
      [0, 0],
      [100, 200],
    ],
  };
  assert.equal(validateTrailMap({ ...map, features: [f] }).features.length, 1);
  assert.throws(() =>
    validateTrailMap({
      ...map,
      features: [
        {
          ...f,
          points: [
            [0, 0],
            [99999, 5],
          ],
        },
      ],
    }),
  );
  assert.throws(() => validateTrailMap({ ...map, features: [f, f] }));
});

import {
  assembleMapRecords,
  clampView,
  zoomView,
} from "../src/models/map-records.js";
test("Map data joins only current same-area alerts and verified matching coordinates", () => {
  const map = {
    id: "gudauri-kobi",
    width: 100,
    height: 100,
    verified: false,
    features: [],
  };
  const resort = { slug: "gudauri-kobi", liftList: [] };
  const base = {
    id: "x",
    slug: "x",
    title: "Test",
    status: "active",
    areaId: "kobi",
    mapPosition: { mapId: map.id, x: 50, y: 60, verified: true },
  };
  const records = assembleMapRecords({
    map,
    resort,
    closures: [
      base,
      { ...base, id: "other", areaId: "mestia" },
      { ...base, id: "expired", endAt: "2020-01-01" },
    ],
    now: new Date("2026-09-21"),
  });
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].position, { x: 50, y: 60 });
  const invalid = assembleMapRecords({
    map,
    resort,
    operations: {
      lifts: [
        {
          id: "lift",
          name: "Lift",
          mapPosition: { mapId: "goderdzi", x: 40, y: 40, verified: true },
        },
      ],
    },
  });
  assert.equal(invalid[0].position, null);
});
test("Zoom respects cursor anchor, bounds and zoom limits", () => {
  const map = { width: 100, height: 100 },
    size = { width: 500, height: 500 };
  const view = clampView({ x: 0, y: 0, z: 1 }, size, map);
  const next = zoomView(view, 2, { x: 250, y: 250 }, size, map);
  assert.deepEqual(next, { x: -250, y: -250, z: 2 });
  assert.equal(zoomView(next, 100, { x: 250, y: 250 }, size, map).z, 8);
  assert.deepEqual(clampView({ x: 500, y: -900, z: 1 }, size, map), view);
});
