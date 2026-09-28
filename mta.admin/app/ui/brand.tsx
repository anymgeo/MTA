import Image from 'next/image';

export function BrandLogo({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return <span className={`brand-logo ${className}`.trim()}>
    <Image src="/brand/mta-logo.svg" alt="M.T.A. Mountain Trails Agency" width={770} height={199} priority={priority} />
  </span>;
}

export function MountainBadge({ className = '' }: { className?: string }) {
  return <span className={`mountain-badge ${className}`.trim()} aria-hidden="true">
    <svg viewBox="0 0 48 48" role="img">
      <path d="M7 34.5 20.2 17l7.1 8.2 5.1-6.4L41 34.5" />
      <path d="M13.5 34.5 23 24.3l4.2 4.9" />
      <path className="mountain-sun" d="M36.5 9.5v5m-7-1 3.4 3.4m10.6-3.4-3.4 3.4" />
    </svg>
  </span>;
}
