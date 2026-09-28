import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const fixture = (name) =>
  JSON.parse(
    readFileSync(
      new URL("../src/data/fixtures/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
const portal = fixture("portal");
const paths = [
  ...fixture("resorts").map((r) => "/webcams/" + r.slug),
  "/events",
  "/events/competitions",
  "/about/history",
  "/about/leadership",
  "/about/infrastructure",
  "/about/documents",
  "/webcams",
  ...portal.safety.map((item) => "/safety/" + item.slug),
  ...portal.events.map((item) => "/events/" + item.slug),
  ...portal.leadership.map((item) => "/about/leadership/" + item.slug),
  ...portal.infrastructure.map((item) => "/about/infrastructure/" + item.slug),
  "",
  "/about",
  "/contact",
  "/faq",
  "/news",
  "/projects",
  "/resorts",
  "/safety",
  "/structure",
  ...fixture("resorts").flatMap(({ slug }) =>
    ["", "/maps", "/activities"].map((s) => "/resorts/" + slug + s),
  ),
  ...fixture("news").map(({ slug }) => "/news/" + slug),
  ...fixture("projects").map(({ slug }) => "/projects/" + slug),
];
let checked = 0;
for (const locale of ["ka", "en"])
  for (const path of paths) {
    const response = await fetch(base + "/" + locale + path);
    assert.equal(response.status, 200, locale + path);
    const html = await response.text();
    assert.ok(
      html.includes('<html lang="' + locale + '"'),
      locale + path + " language",
    );
    assert.match(html, /<title>[^<]+\| mta\.ski<\/title>/);
    assert.match(html, /<meta name="description" content="[^\"]+"/);
    assert.ok(
      html.includes(
        'rel="canonical" href="https://mta.ski/' + locale + path + '"',
      ),
      locale + path + " canonical",
    );
    for (const lang of ["ka", "en"])
      assert.ok(
        html.includes('hrefLang="' + lang + '"'),
        locale + path + " alternate " + lang,
      );
    assert.ok(
      html.includes(
        'property="og:locale" content="' +
          (locale === "ka" ? "ka_GE" : "en_US") +
          '"',
      ),
    );
    assert.ok(!html.includes("MISSING_MESSAGE"), locale + path + " messages");
    checked++;
  }
const root = await fetch(base + "/", {
  redirect: "manual",
  headers: { "Accept-Language": "ka" },
});
assert.ok([307, 308].includes(root.status));
assert.ok(root.headers.get("location").endsWith("/ka"));
const legacy = await fetch(base + "/news?from=legacy", {
  redirect: "manual",
  headers: { "Accept-Language": "en" },
});
assert.ok(legacy.headers.get("location").endsWith("/en/news?from=legacy"));
assert.equal((await fetch(base + "/ka/resorts/does-not-exist")).status, 404);
assert.equal((await fetch(base + "/en/does-not-exist")).status, 404);
assert.equal((await fetch(base + "/Gudauri.jpg")).status, 200);
assert.equal(
  (
    await fetch(base + "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "Visitor",
        email: "test@example.com",
        subject: "general",
        message: "Test only; no delivery configured.",
      }),
    })
  ).status,
  503,
);
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
assert.ok(sitemap.includes("https://mta.ski/ka/resorts/gudauri-kobi"));
assert.ok(
  (await (await fetch(base + "/robots.txt")).text()).includes(
    "https://mta.ski/sitemap.xml",
  ),
);
console.log(
  "Passed: " +
    checked +
    " localized pages, metadata, redirects, 404s, assets, contact boundary and sitemap.",
);

for (const payload of [{}, { website: "bot" }])
  assert.equal(
    (
      await fetch(base + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    ).status,
    400,
  );
const pdf = await fetch(
  base +
    "/api/documents/download?url=" +
    encodeURIComponent("/documents/fis-code-of-conduct.pdf"),
);
assert.equal(pdf.status, 200);
assert.match(pdf.headers.get("content-disposition"), /attachment/);
assert.equal(
  Buffer.from(await pdf.arrayBuffer())
    .subarray(0, 5)
    .toString(),
  "%PDF-",
);
assert.equal(
  (
    await fetch(
      base +
        "/api/documents/download?url=" +
        encodeURIComponent("https://example.com/test.pdf"),
    )
  ).status,
  404,
);
for (const p of [
  "/safety/closures/missing",
  "/about/leadership/missing",
  "/events/missing",
])
  assert.equal((await fetch(base + "/en" + p)).status, 404);
console.log(
  "Passed: PDF download/allowlist, contact validation and new detail 404s.",
);
