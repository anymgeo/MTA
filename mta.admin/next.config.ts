import type { NextConfig } from 'next';
import path from 'node:path';
const api = process.env.API_ORIGIN || 'http://127.0.0.1:5100';
const site = process.env.SITE_INTERNAL_ORIGIN || 'http://127.0.0.1:3100';
const config: NextConfig = {
  turbopack:{root:path.resolve(__dirname,'..')},
  outputFileTracingRoot:path.resolve(__dirname,'..'),
  output: 'standalone',
  // General CMS requests keep their existing bound. Map image uploads have a
  // dedicated streaming route and never pass through this buffered rewrite.
  experimental: { proxyClientMaxBodySize: '48mb' },
  // Keep verification builds isolated from the running local admin server.
  distDir: process.env.MTA_BUILD_DIR || '.next',
  async rewrites() { return [
    { source: '/backend/:path*', destination: `${api}/api/:path*` },
    { source: '/media/:path*', destination: `${api}/media/:path*` },
    { source: '/news/:path*', destination: `${site}/news/:path*` },
    { source: '/assets/:path*', destination: `${site}/:path*` },
  ]; },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'same-origin' },
    { key: 'Cache-Control', value: 'no-store' },
  ] }]; },
};
export default config;
