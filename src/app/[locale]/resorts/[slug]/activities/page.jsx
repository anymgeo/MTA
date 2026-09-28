import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {getResortBySlug,getResortBuildParams} from '@/services/resorts';
import {contentMetadata} from '@/lib/metadata';
import ResortSeasonActivities from '@/components/resort/ResortSeasonActivities';
export function generateStaticParams(){return getResortBuildParams();}
export const dynamic = 'force-dynamic';
export default async function Page({params}) {const {locale,slug}=await params;const resort=await getResortBySlug(slug,{locale});if(!resort)notFound();return <ResortSeasonActivities resort={resort}/>;}
export async function generateMetadata({params}) {const {locale,slug}=await params;const resort=await getResortBySlug(slug,{locale});if(!resort)notFound();const t=await getTranslations({locale,namespace:'Metadata'});return contentMetadata(locale,'/resorts/'+slug+'/activities',resort.name+' · '+t('activitiesTitle'),resort.description,resort.image);}
