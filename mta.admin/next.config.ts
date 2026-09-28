import type { NextConfig } from 'next';
const api = process.env.API_ORIGIN || 'http://127.0.0.1:5100';
const site = process.env.SITE_INTERNAL_ORIGIN || 'http://127.0.0.1:3100';
const config: NextConfig = {
  output: 'standalone',
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
