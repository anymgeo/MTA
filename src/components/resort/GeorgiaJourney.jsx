import { useTranslations } from "next-intl";
export default function GeorgiaJourney({ resort }) {
  const t = useTranslations("ResortPage"), page = resort.page || {};
  return <div className="rp-journey" id="getting-there">
    <div className="rp-journey-map">
      <svg viewBox="0 0 700 370" role="img" aria-label={t("journeyMap", { resort: resort.name })}>
        <rect width="700" height="370" rx="24" fill="#e9f3f5" />
        <path d="M58 62 96 43 142 55 178 73 214 74 247 98 282 90 324 112 357 103 390 132 433 119 468 152 499 155 530 182 575 184 614 217 655 223 627 251 592 247 568 280 529 284 498 266 473 290 441 282 411 307 378 285 348 291 322 273 292 278 263 256 230 258 205 242 176 253 157 224 137 204 131 173 114 148 96 119 74 100Z" fill="#fdfdf9" stroke="#a4b8b5" strokeWidth="2" />
        <path d="m160 107 22-23 25 34 21-17 29 29m46-10 22-20 28 37 28-18 35 41m-236 53 17-21 30 28" fill="none" stroke="#c9d6cf" strokeWidth="3" />
        <circle cx={70 + Number(page.markerX || 50) * 5.6} cy={40 + Number(page.markerY || 50) * 2.9} r="11" fill="var(--resort-color)" stroke="#17231f" strokeWidth="3" />
        <text x={70 + Number(page.markerX || 50) * 5.6} y={23 + Number(page.markerY || 50) * 2.9} textAnchor="middle" fontSize="15" fontWeight="700" fill="#17231f">{resort.name}</text>
        <text x="35" y="340" fontSize="14" fill="#52615b">{t("schematic")}</text>
      </svg>
      <div className="rp-travel-times">{(page.travelTimes || []).map((row,i) => <div key={i}><strong>{row.city}</strong><span>{row.time || t("timePending")}</span></div>)}</div>
    </div>
    <div><h3>{t("gettingThere")}</h3><p>{page.arrivalText || resort.transport?.car || t("copyPending")}</p>
      {resort.transport?.transfer && <p>{resort.transport.transfer}</p>}
      {resort.transport?.routeUrl && <a className="rp-button" href={resort.transport.routeUrl} target="_blank" rel="noreferrer">{t("directions")} ↗</a>}
    </div>
  </div>;
}
