import type { Metadata } from 'next';
import localFont from 'next/font/local';
import 'primereact/resources/themes/lara-light-teal/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './globals.css';
import './brand.css';
import Providers from './providers';
const fira = localFont({ src: '../public/fonts/FiraGO-400.ttf', variable: '--font-georgian', display: 'swap' });
export const metadata: Metadata = {
  title: 'MTA Admin Panel', robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ka" className={fira.variable}><body><Providers>{children}</Providers></body></html>;
}
