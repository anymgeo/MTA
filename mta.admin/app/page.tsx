import Admin from './ui/admin';
export const dynamic = 'force-dynamic';
export default function Page() {
  return <Admin siteUrl={process.env.SITE_PUBLIC_ORIGIN || 'http://localhost:3100'} />;
}
