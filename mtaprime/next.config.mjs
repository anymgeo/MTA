import createNextIntlPlugin from "next-intl/plugin";
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const workspaceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");
export default withNextIntl({
  reactCompiler: true,
  turbopack:{root:workspaceRoot},
  outputFileTracingRoot:workspaceRoot,
  images: { qualities: [75, 80] },
  outputFileTracingIncludes: {
    '/api/gallery/*/*': ['./src/fonts/FiraGO-400.ttf', './public/brand/mta-watermark-white.svg', './public/**/*.{jpg,jpeg,png,webp}'],
  },
  // Vercel's Next adapter is incompatible with standalone output on Next 16.3.
  // Keep standalone for Docker deployments, where the generated server is used.
  output: process.env.VERCEL ? undefined : "standalone",
  // Isolate verification builds from the running dev server / OneDrive file locks.
  distDir: process.env.MTA_BUILD_DIR || ".next",
  async rewrites() {
    if (process.env.PUBLIC_CONTENT_MODE === "snapshot") return [];
    const api = process.env.API_ORIGIN || "http://127.0.0.1:5100";
    return [{ source: "/media/:path*", destination: `${api}/media/:path*` }];
  },
});
