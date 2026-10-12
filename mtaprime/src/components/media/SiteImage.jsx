import Image from 'next/image';

// CMS uploads and bundled photos use Next's responsive optimizer. Preserve
// existing external CMS/live-camera URLs without opening an unrestricted
// server-side image proxy; SVG/data/blob URLs also keep their native format.
export default function SiteImage({ src, alt, unoptimized, quality = 75, ...props }) {
  const external = typeof src === 'string' && /^(?:https?:)?\/\//i.test(src);
  return <Image {...props} src={src} alt={alt} quality={quality} unoptimized={unoptimized ?? external} />;
}
