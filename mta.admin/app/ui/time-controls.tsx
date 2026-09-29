'use client';
import { Dropdown } from 'primereact/dropdown';
export const times=Array.from({length:48},(_,i)=>`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`);
export const durations=[1,2,3,4,5,6,7,8,9,10,12,15,20,25,30,45,60];
export const liftTypes={en:['Gondola','Chairlift','Drag lift','Surface lift','Magic carpet'],ka:['გონდოლა','სავარძლიანი საბაგირო','ბუგელი','ზედაპირული საბაგირო','კონვეიერი']};
export const travelDurations=Array.from({length:48},(_,i)=>(i+1)*15);
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthKa=['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი','ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'];
export function HoursSelect({value,onChange,disabled=false}:{value:string;onChange:(v:string)=>void;disabled?:boolean}){
  const parts=value.match(/^(\d{2}:\d{2})\s*[–—-]\s*(\d{2}:\d{2})$/);
  const options=times.map(value=>({label:value,value}));
  return <span className="time-select-pair"><Dropdown aria-label="Opening time / გახსნა" className="premium-dropdown" disabled={disabled} options={options} placeholder="—" showClear value={parts?.[1]||''} onChange={e=>onChange(e.value?`${e.value}–${parts?.[2]||e.value}`:'')}/><span>–</span><Dropdown aria-label="Closing time / დახურვა" className="premium-dropdown" disabled={disabled} options={options} placeholder="—" showClear value={parts?.[2]||''} onChange={e=>onChange(e.value?`${parts?.[1]||e.value}–${e.value}`:'')}/>{value&&!parts&&value!=='—'&&<small>Existing: {value}. Choose times to update.</small>}</span>;
}
export function DurationSelect({value,onChange,travel=false}:{value:string;onChange:(v:string)=>void;travel?:boolean}){
  const choices=(travel?travelDurations:durations).map(n=>`${n} min`);
  return <Dropdown aria-label={travel?'Driving duration / მგზავრობის დრო':'Ride duration / ხანგრძლივობა'} className="premium-dropdown" options={choices.map(value=>({label:value,value}))} placeholder="დასაზუსტებელია / To be confirmed" showClear value={choices.includes(value)?value:''} onChange={e=>onChange(e.value||'')}/>;
}
export function SeasonSelect({value,onChange,locale='en'}:{value:string;onChange:(v:string)=>void;locale?:'ka'|'en'}){
  const parts=value.split(/\s*[–—-]\s*/);
  const labels=locale==='ka'?monthKa:months;
  const start=Math.max(months.indexOf(parts[0]),monthKa.indexOf(parts[0])),end=Math.max(months.indexOf(parts[1]),monthKa.indexOf(parts[1]));
  const options=months.map((month,index)=>({label:`${monthKa[index]} / ${month}`,value:index}));
  return <span className="time-select-pair"><Dropdown aria-label="Season starts / სეზონის დასაწყისი" className="premium-dropdown" options={options} placeholder="—" showClear value={start<0?null:start} onChange={e=>onChange(e.value===null||e.value===undefined?'':`${labels[Number(e.value)]} – ${labels[end<0?Number(e.value):end]}`)}/><Dropdown aria-label="Season ends / სეზონის დასასრული" className="premium-dropdown" options={options} placeholder="—" showClear value={end<0?null:end} onChange={e=>onChange(e.value===null||e.value===undefined?'':`${labels[start<0?Number(e.value):start]} – ${labels[Number(e.value)]}`)}/>{value&&start<0&&value!=='—'&&<small>Existing: {value}. Choose months to update.</small>}</span>;
}
