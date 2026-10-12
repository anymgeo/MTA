import 'server-only';
import { cache } from 'react';
import { env } from '@/config/env';
import { request } from './client';

// Editorial CMS collections deliberately bypass cached fixture content.
export const getCmsRecords = cache(async (module, locale) => {
  if (!env.snapshot && !env.apiBaseUrl) throw new Error('API_BASE_URL must be configured for the content CMS.');
  const records = await request('content/' + module, { locale, revalidate: 0 });
  // Compatibility for existing CMS links; new links remain fully editorial.
  if (module !== 'navigation') return records;
  const href = value => value === '/#live' || value === '#live' ? '/today' : value;
  return records.map(item => ({...item, href:href(item.href), introHref:href(item.introHref), children:item.children?.map(child=>({...child,href:href(child.href)}))}));
});
export async function getCmsSettings(module, locale) {
  return (await getCmsRecords(module, locale)).find(r => r.slug === 'settings') ?? null;
}
