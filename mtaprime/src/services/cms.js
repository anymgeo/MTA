import 'server-only';
import { cache } from 'react';
import { env } from '@/config/env';
import { request } from './client';

// Editorial CMS collections deliberately bypass cached fixture content.
export const getCmsRecords = cache(async (module, locale) => {
  if (!env.apiBaseUrl) throw new Error('API_BASE_URL must be configured for the content CMS.');
  return request('content/' + module, { locale, revalidate: 0 });
});
export async function getCmsSettings(module, locale) {
  return (await getCmsRecords(module, locale)).find(r => r.slug === 'settings') ?? null;
}
