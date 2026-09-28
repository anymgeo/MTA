import ResortIcon from "@/components/brand/ResortIcon";
export default function ResortIdentity({ resort, className = "" }) {
  return <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
    {resort.page?.logoUrl ? <img src={resort.page.logoUrl} alt={resort.name} className="h-14 max-w-48 object-contain" /> :
      <><ResortIcon slug={resort.slug} className="h-11 w-11" /><span className="max-w-36 text-sm font-black sm:text-lg">{resort.name}</span></>}
  </span>;
}
