'use client';
import { useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
export default function RichCopy({id,value,onChange}:{id:string;value:string;onChange:(value:string)=>void}) {
 const ref=useRef<HTMLTextAreaElement>(null);
 const format=(prefix:string,suffix:string)=>{const start=ref.current?.selectionStart??value.length;const end=ref.current?.selectionEnd??start;onChange(value.slice(0,start)+prefix+value.slice(start,end)+suffix+value.slice(end));ref.current?.focus();};
 return <div className="cms-rich"><div className="cms-rich-tools"><Button type="button" text label="B" aria-label="Bold / გამუქება" onClick={()=>format('**','**')}/><Button type="button" text label="I" aria-label="Italic / დახრა" onClick={()=>format('*','*')}/><Button type="button" text icon="pi pi-link" aria-label="Link / ბმული" onClick={()=>format('[','](https://)')}/></div><InputTextarea ref={ref} id={id} value={value} onChange={e=>onChange(e.target.value)} rows={5}/><small>**Bold** · *Italic* · [Link](https://…) · ტექსტის სტილები / Text formatting</small></div>;
}
