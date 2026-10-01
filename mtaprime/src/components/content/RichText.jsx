import { Fragment } from 'react';
// Render editorial Markdown as React nodes; raw HTML is never executed.
export default function RichText({text='',className=''}) {
 const parts=String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\)|\n)/g);
 return <span className={className}>{parts.map((part,i)=>{
  if(part==='\n')return <br key={i}/>;
  if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
  if(part.startsWith('*')&&part.endsWith('*'))return <em key={i}>{part.slice(1,-1)}</em>;
  const link=/^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
  if(link&&(/^(https:\/\/|\/(?!\/))/.test(link[2])))return <a key={i} href={link[2]} className="font-semibold" rel="noreferrer">{link[1]}</a>;
  return <Fragment key={i}>{part}</Fragment>;
 })}</span>;
}
