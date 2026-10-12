import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { getResortBySlug } from '@/services/resorts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const cache = new Map();
let processing = 0;
const root = process.cwd();
const fontfile = path.join(root, 'src/fonts/FiraGO-400.ttf');
async function original(url) {
  // Only CMS-selected local assets: never proxy a user-supplied remote URL.
  if (!/^\/(?:[\p{L}\p{N}_ .-]+\/)*[\p{L}\p{N}_ .-]+\.(?:jpg|jpeg|png|webp)$/iu.test(url) || url.split('/').includes('..')) throw new Error('Invalid photo path');
  if (!url.startsWith('/media/')) return readFile(path.join(root, 'public', url.slice(1)));
  const response = await fetch(new URL(url, process.env.API_ORIGIN || 'http://127.0.0.1:5100'), { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok || Number(response.headers.get('content-length')) > 45 * 1024 * 1024) throw new Error('Original unavailable');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 45 * 1024 * 1024) throw new Error('Original too large');
  return bytes;
}
async function watermarked(url) {
  const source = await original(url);
  const pipeline = sharp(source, { limitInputPixels: 64000000 }).rotate();
  const metadata = await pipeline.metadata();
  const swap = metadata.orientation >= 5 && metadata.orientation <= 8;
  const width = swap ? metadata.height : metadata.width, height = swap ? metadata.width : metadata.height;
  const margin = Math.max(8, Math.round(Math.min(width, height) * .025));
  const logoSize = Math.max(8, Math.round(width * .05));
  const fontSize = Math.max(7, Math.round(width * .0045));
  const svg = (await readFile(path.join(root, 'public/brand/mta-watermark-white.svg'), 'utf8')).replace('<svg ', '<svg opacity=".8" ');
  // Same uncropped, white wordmark and responsive ratio as GalleryWatermark.
  const logo = await sharp(Buffer.from(svg)).resize({ width: logoSize }).png().toBuffer();
  const logoInfo = await sharp(logo).metadata();
  // Retain the previously approved attribution, without a dark panel.
  const text = await sharp({ text: { text: '<span foreground="white" alpha="80%">Photo belongs to MTA\nფოტო ეკუთვნის MTA-ს</span>', font: `FiraGO ${fontSize}`, fontfile, rgba: true, align: 'left' } }).png().toBuffer();
  const textInfo = await sharp(text).metadata();
  const panelHeight = logoInfo.height + textInfo.height + 4;
  return pipeline.composite([
    { input: logo, left: margin, top: height - panelHeight - margin },
    { input: text, left: margin, top: height - textInfo.height - margin },
  ]).jpeg({ quality: 90 }).toBuffer();
}
export async function GET(request, { params }) {
  const { slug, index } = await params;
  const locale = new URL(request.url).searchParams.get('locale') || 'ka';
  if (!/^\d{1,2}$/.test(index) || !['ka', 'en'].includes(locale)) return new Response('Not found', { status: 404 });
  const resort = await getResortBySlug(slug, { locale });
  const urls = resort?.gallery?.length ? resort.gallery : resort ? [resort.image] : [];
  const url = urls[Number(index)];
  if (!url) return new Response('Not found', { status: 404 });
  const key = createHash('sha256').update(`watermark-v4-white:${url}`).digest('hex');
  try {
    let promise = cache.get(key);
    if (!promise) {
      if (processing >= 2) return new Response('Please retry shortly', { status: 429, headers: { 'Retry-After': '2' } });
      processing++;
      promise = watermarked(url).finally(() => { processing--; }); cache.set(key, promise);
      if (cache.size > 16) cache.delete(cache.keys().next().value);
    }
    const bytes = await promise;
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Content-Disposition': `attachment; filename="${slug}-photo-${Number(index) + 1}-mta.jpg"`, 'Cache-Control': 'private, no-cache', 'ETag': `"${key}"`, 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    cache.delete(key); console.error('Gallery watermark failed', error.message);
    return new Response('Photo download unavailable. Please retry.', { status: 503 });
  }
}
