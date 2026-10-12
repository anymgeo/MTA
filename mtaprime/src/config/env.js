import "server-only";
function httpUrl(value, name) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error(name + " must be an HTTP(S) URL");
  return url.href.replace(/\/$/, "");
}
const snapshot = process.env.PUBLIC_CONTENT_MODE === "snapshot";
const dataSource = snapshot ? "snapshot" : process.env.DATA_SOURCE || "fixtures";
if (!["fixtures", "api", "snapshot"].includes(dataSource))
  throw new Error("DATA_SOURCE must be fixtures or api");
export const env = Object.freeze({
  snapshot,
  siteUrl: httpUrl(process.env.SITE_URL || "https://mta.ski", "SITE_URL"),
  dataSource,
  newsDataSource: snapshot ? "snapshot" : process.env.NEWS_DATA_SOURCE || dataSource,
  resortsDataSource: snapshot ? "snapshot" : process.env.RESORTS_DATA_SOURCE || dataSource,
  apiBaseUrl: !snapshot && process.env.API_BASE_URL
    ? httpUrl(process.env.API_BASE_URL, "API_BASE_URL")
    : null,
  apiToken: snapshot ? null : process.env.API_TOKEN || null,
});
if (!["fixtures", "api", "snapshot"].includes(env.newsDataSource))
  throw new Error("NEWS_DATA_SOURCE must be fixtures or api");
if (!["fixtures", "api", "snapshot"].includes(env.resortsDataSource))
  throw new Error("RESORTS_DATA_SOURCE must be fixtures or api");
if (env.resortsDataSource === "api" && !env.apiBaseUrl)
  throw new Error("API_BASE_URL is required for resorts API mode");
if (env.newsDataSource === "api" && !env.apiBaseUrl)
  throw new Error("API_BASE_URL is required for news API mode");
if (dataSource === "api" && !env.apiBaseUrl)
  throw new Error("API_BASE_URL is required for API mode");
