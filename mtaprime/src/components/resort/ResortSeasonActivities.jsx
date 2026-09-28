'use client';
import {useTranslations} from 'next-intl';
import ResortIcon from "@/components/brand/ResortIcon";
import {Link} from '@/i18n/navigation';
import {useSiteSeason} from '@/providers/SeasonProvider';
import SeasonToggle from '@/components/SeasonToggle';
import {ArrowLeft,Footprints} from 'lucide-react';
export default function ResortSeasonActivities({resort}) {
 const t=useTranslations('resorts_Detail_activities');const {season}=useSiteSeason();
 return <main className="min-h-screen bg-surface px-6 py-32 text-ink md:px-10"><div className="mx-auto max-w-[1400px]"><Link href={'/resorts/'+resort.slug} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em]"><ArrowLeft size={16}/>{t('backToResort_bc00ce')}</Link><p className="mt-16 flex items-center gap-3 text-xs font-bold uppercase tracking-[.22em] text-muted"><ResortIcon slug={resort.slug} />{resort.name}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-6"><h1 className="text-5xl font-black tracking-[-.06em] md:text-7xl">{t('onTheMountain_ccfcd3')}</h1><SeasonToggle/></div><div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{resort.experience[season].map(activity=><article key={activity.iconKey} className="rounded-xl bg-canvas p-6"><Footprints size={22}/><h2 className="mt-16 text-2xl font-bold">{activity.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{activity.text}</p></article>)}</div></div></main>;
}
