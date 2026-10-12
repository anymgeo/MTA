import RichText from './RichText';
import Image from '@/components/media/SiteImage';

// A deliberately small, safe block renderer for CMS Markdown; no raw HTML.
export default function EditorialBody({ paragraphs = [], className = '' }) {
  return <div className={`space-y-7 text-lg leading-9 ${className}`}>{paragraphs.map((text, index) => {
    const image = /^!\[([^\]]*)\]\((\/[^\s)]+)\)$/.exec(text);
    if (image) return <figure key={index}><Image src={image[2]} alt={image[1]} width={1200} height={800} sizes="(max-width: 768px) 100vw, 66vw" className="h-auto w-full rounded-2xl" loading="lazy" />{image[1] && <figcaption className="mt-2 text-sm text-muted">{image[1]}</figcaption>}</figure>;
    const heading = /^(#{1,6})\s+(.+)/s.exec(text);
    if (heading) { const Tag = `h${Math.max(2, Math.min(6, heading[1].length))}`; return <Tag key={index} className="text-2xl font-bold text-ink"><RichText text={heading[2]} /></Tag>; }
    if (text.startsWith('```')) return <pre key={index} className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-surface p-5 text-sm">{text.replace(/^```[^\n]*\n|\n```$/g, '')}</pre>;
    const lines = text.split('\n');
    if (lines.every(line => /^\s*(?:- |\d+\. )/.test(line))) {
      const Tag = /^\s*\d+\./.test(lines[0]) ? 'ol' : 'ul';
      return <Tag key={index} className={Tag === 'ol' ? 'list-decimal space-y-2 pl-6' : 'list-disc space-y-2 pl-6'}>{lines.map((line, i) => <li key={i}><RichText text={line.replace(/^\s*(?:- |\d+\. )/, '')} /></li>)}</Tag>;
    }
    return <p key={index}><RichText text={text} /></p>;
  })}</div>;
}
