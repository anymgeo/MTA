import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");
export default withNextIntl({
  reactCompiler: true,
  // Vercel's Next adapter is incompatible with standalone output on Next 16.3.
  // Keep standalone for Docker deployments, where the generated server is used.
  output: process.env.VERCEL ? undefined : "standalone",
  // Isolate verification builds from the running dev server / OneDrive file locks.
  distDir: process.env.MTA_BUILD_DIR || ".next",
  async rewrites() {
    const api = process.env.API_ORIGIN || "http://127.0.0.1:5100";
    return [{ source: "/media/:path*", destination: `${api}/media/:path*` }];
  },
});
