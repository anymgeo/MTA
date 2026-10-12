import { getResorts } from '@/services/resorts';
import { getCmsRecords } from '@/services/cms';
import { Link } from '@/i18n/navigation';
import ResortIcon from '@/components/brand/ResortIcon';
import { ArrowUpRight } from 'lucide-react';
import { contentMetadata } from '@/lib/metadata';

async function mapContent(locale) {
  const navigation = await getCmsRecords('navigation', locale);
  return navigation.find(item => item.menuKind === 'today')?.children?.find(item => item.iconKey === 'map');
}
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const content = await mapContent(locale);
  return contentMetadata(locale, '/maps', content?.title || 'MTA', content?.description || '');
}
export default async function MapsPage({ params }) {
  const { locale } = await params;
  const [resorts, content] = await Promise.all([getResorts({ locale }), mapContent(locale)]);
  return <main className="min-h-screen bg-canvas px-6 pb-24 pt-40 md:px-10"><div className="mx-auto max-w-7xl">
    <h1 className="editorial-page-title">{content?.title}</h1><p className="mt-6 max-w-2xl leading-8 text-muted">{content?.description}</p>
    <div className="mt-12 grid gap-6 sm:grid-cols-2">{resorts.map(resort => <Link key={resort.id} href={`/resorts/${resort.slug}/maps`} className="group flex items-center gap-5 rounded-3xl bg-surface p-7 transition hover:bg-border/30">
      <ResortIcon slug={resort.slug} className="h-12 w-12" /><span><strong className="text-xl font-bold">{resort.name}</strong><small className="mt-2 block text-muted">{resort.region}</small></span><ArrowUpRight className="ml-auto" aria-hidden="true" />
    </Link>)}</div>
  </div></main>;
}
