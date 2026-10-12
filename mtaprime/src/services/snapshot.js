import 'server-only';
import { notFound } from 'next/navigation';
import snapshot from '@/data/published-snapshot.json';

/** Strict lookup: a snapshot release never silently falls back to a local API. */
export function snapshotRequest(resource, locale) {
  if (locale && !['ka', 'en'].includes(locale)) notFound();
  const url = new URL(resource, 'https://snapshot.invalid/');
  if (locale) url.searchParams.set('locale', locale);
  url.searchParams.sort();
  const key = url.pathname.slice(1) + url.search;
  if (Object.hasOwn(snapshot.responses, key)) return structuredClone(snapshot.responses[key]);
  if (url.pathname.startsWith('/news/') && locale) {
    return structuredClone(snapshot.responses['news?locale=' + locale].find(item => item.slug === decodeURIComponent(url.pathname.slice(6))) || null);
  }
  throw new Error('Resource not included in public snapshot: ' + key);
}
