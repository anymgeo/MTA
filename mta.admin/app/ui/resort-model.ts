import type { ResortPageContent } from './resort-page-editor';

export type Media = { image: string; heroImages: string[] };
export type LiveCardSettings = { winterImage?: string; summerImage?: string; imageAlt?: string; note?: string; featured?: boolean; homepageVisible?: boolean; displayOrder?: number };
export type Conditions = { resortId: string; status: string; temperature: number | null; weatherCondition: string | null; snowDepthCm: number | null; newSnow24hCm: number | null; liftsOpen: number | null; liftsTotal: number | null; trailsOpen: number | null; trailsTotal: number | null; windSpeedKmh: number | null; windDirection: string | null; visibility: string | null; operatingFrom: string | null; operatingTo: string | null; topElevationM: number | null; lastUpdatedAt: string | null };
export type ResortContent = {
  page?: ResortPageContent;
  liveCard?: LiveCardSettings;
  name: string; region: string; description: string; image: string; summerImage: string;
  lifts: string; trails: string; temp: string; snow: string; newSnow: string; wind: string;
  hours: string; elevation: string; highestPoint: string; pistes: string; winterSeason: string;
  heroImages: string[]; gallery: string[]; seasons?: { winter: Media; summer: Media };
  transport: { car: string; transfer: string; routeUrl: string };
  liftList: { name: string; type: string; hours: string }[];
  trailDifficulty: { label: string; value: number; description: string }[];
  experience: { winter: { title: string; text: string; iconKey: string }[]; summer: { title: string; text: string; iconKey: string }[] };
};
export type Resort = { id: string; slug: string; status: string; version: string; liveManaged?: boolean; ka: ResortContent; en: ResortContent };

export const statusOptions = [{ label: 'ღიაა / Open', value: 'OPEN' }, { label: 'შეზღუდულია / Limited', value: 'LIMITED' }, { label: 'დახურულია / Closed', value: 'CLOSED' }];
export const infoFields = [
  ['lifts', 'საბაგიროები / Lifts'], ['trails', 'ტრასები / Trails'], ['temp', 'ტემპერატურა / Temperature'], ['snow', 'თოვლი / Snow'], ['newSnow', 'ახალი თოვლი / New snow'], ['wind', 'ქარი / Wind'],
  ['hours', 'სამუშაო საათები / Hours'], ['elevation', 'სიმაღლე / Elevation'], ['highestPoint', 'უმაღლესი წერტილი / Highest point'], ['pistes', 'ტრასების სიგრძე / Trail length'], ['winterSeason', 'ზამთრის სეზონი / Winter season'],
] as const;
export const conditionLabels = {status:'სტატუსი / Status',temperature:'ტემპერატურა / Temperature',weatherCondition:'ამინდი / Weather',snowDepthCm:'თოვლი (სმ) / Snow',newSnow24hCm:'ახალი თოვლი (24სთ) / New snow',liftsOpen:'ღია საბაგიროები / Open lifts',liftsTotal:'სულ საბაგიროები / Total lifts',trailsOpen:'ღია ტრასები / Open trails',trailsTotal:'სულ ტრასები / Total trails',windSpeedKmh:'ქარის სიჩქარე / Wind speed',windDirection:'ქარის მიმართულება / Wind direction',visibility:'ხილვადობა / Visibility',operatingFrom:'გახსნა / Opens',operatingTo:'დახურვა / Closes',topElevationM:'სიმაღლე (მ) / Elevation',lastUpdatedAt:'ბოლო განახლება / Updated'} as const;

export function blankContent(): ResortContent { return { name: '', region: '', description: '', image: '', summerImage: '', lifts: '—', trails: '—', temp: '—', snow: '—', newSnow: '—', wind: '—', hours: '—', elevation: '—', highestPoint: '—', pistes: '—', winterSeason: '—', heroImages: [], gallery: [], liftList: [], trailDifficulty: [], experience: { winter: [], summer: [] }, transport: { car: '', transfer: '', routeUrl: '' } }; }
export function blankResort(): Resort { return { id: '', slug: '', status: 'CLOSED', version: '', ka: blankContent(), en: blankContent() }; }
export function preview(path: string) { return path.startsWith('/media/') ? path : '/assets' + path; }
