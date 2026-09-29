import Admin from './ui/admin';
export const dynamic = 'force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{section?:string}>}) {
  const {section}=await searchParams;
  return <Admin siteUrl={process.env.SITE_PUBLIC_ORIGIN || 'http://localhost:3100'} initialSection={section==='resorts'?'resorts':'news'} />;
}
