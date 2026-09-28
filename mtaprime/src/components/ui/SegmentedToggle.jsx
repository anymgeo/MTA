"use client";
export default function SegmentedToggle({ label, value, options, onChange, disabled = false }) {
 const selected = Math.max(0, options.findIndex(option => option.value === value));
 return <div role="group" aria-label={label} aria-busy={disabled} className="segmented-toggle">
 <span aria-hidden="true" className="segmented-toggle__thumb" style={{transform:`translateX(${selected*100}%)`}} />
 {options.map(({value: v,label: text,icon: Icon,compact})=><button key={v} type="button" disabled={disabled} aria-label={text} aria-pressed={value===v} onClick={()=>onChange(v)} className="segmented-toggle__option">
 {Icon && <Icon size={15} aria-hidden="true"/>}<span className={compact?'hidden xl:inline':undefined}>{text}</span></button>)}
 </div>;
}
