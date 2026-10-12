import { getResorts } from '@/services/resorts';
import LiveMountainData from '@/components/LiveMountainData';
import { contentMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return contentMetadata(locale, '/today', locale === 'ka' ? 'დღეს მთაში' : 'Today in the Mountains', locale === 'ka' ? 'ოთხივე კურორტის მიმდინარე პირობები და სტატუსი.' : 'Current conditions and operating status across all four resorts.');
}
export default async function TodayPage({ params }) {
  const { locale } = await params;
  const resorts = await getResorts({ locale });
  return <main className="pt-28" data-today-page><h1 className="sr-only">{locale === 'ka' ? 'დღეს მთაში' : 'Today in the Mountains'}</h1><LiveMountainData resorts={resorts} standalone /></main>;
}
