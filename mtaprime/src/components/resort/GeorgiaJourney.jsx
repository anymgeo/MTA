import { useTranslations } from "next-intl";
export default function GeorgiaJourney({ resort }) {
  const t = useTranslations("ResortPage"), page = resort.page || {};
  const markerX = 40 + Number(page.markerX || 50) * 6.2;
  const markerY = 50 + Number(page.markerY || 50) * 2.8;
  return <div className="rp-journey" id="getting-there">
    <div className="rp-journey-map">
      <svg viewBox="0 0 700 370" role="img" aria-label={t("journeyMap", { resort: resort.name })}>
        <rect width="700" height="370" rx="24" fill="#e9f3f5" />
        {/* Simplified from the public-domain Natural Earth 1:10m country boundary. */}
        <path d="M184.7 179.3 L172.9 142.5 L159.1 137.4 L151.6 135.6 L143.4 130.7 L133.6 114.9 L123.2 111 L113.7 104.4 L96 104.2 L91.8 101.6 L85.5 98.9 L71.3 97.2 L66.1 89.8 L61.5 78.4 L49.3 72.7 L40.5 68.7 L56.5 50 L92.2 57.1 L105.1 55.8 L134.8 72.2 L153.4 73.6 L168.9 76.7 L173.2 82.4 L187.1 89.9 L206.6 91.2 L221.3 91.6 L233.1 93.2 L258.9 87.6 L272.9 93.6 L284.3 98.1 L295.6 94.1 L308 98.7 L317.9 106.1 L332.9 120.1 L362.9 128.3 L378.1 137.1 L392.5 141.7 L385.6 151.9 L396.6 159.4 L405.4 163.2 L412 157.9 L429.2 154.7 L436.1 146.6 L457.9 141.3 L470.3 142.5 L479 149.3 L484.8 150 L494.4 141 L509.6 148.1 L517.7 147.6 L531.2 162.4 L540.2 166.3 L567.9 168.1 L560.8 199.5 L578.4 211.5 L589.7 221.1 L594.6 220.8 L598.3 222.4 L602.7 225 L613.2 225 L615.6 224.8 L625.6 232.1 L632.1 242.9 L623.3 251.8 L613.3 253 L616.1 269.3 L619.3 266.8 L622.4 276 L630.7 283.7 L650.5 293.6 L654.1 296.7 L660 305 L658 306.8 L655.9 311.2 L653.2 322.2 L647.8 324.3 L642.5 328.8 L635.4 325.9 L621.1 317.6 L608.3 312.8 L599.6 316.6 L574.6 309.2 L568.8 299.8 L570 297 L546.3 287.3 L538.6 287.8 L526.4 285.7 L500.4 305.1 L485 306.3 L490.2 310.6 L469.5 310.4 L463.3 314.2 L459.2 312.8 L455.2 314.3 L444 311.4 L440.3 312.9 L431.1 310.4 L426.3 311 L422.5 315.2 L411.1 316.2 L398.3 317.3 L386 323.1 L361.1 323.3 L359 317.6 L348.4 313.6 L334.4 308.1 L333.1 305 L332.8 301.5 L317.4 291.2 L312.6 285.1 L308.3 282.9 L305.1 280.3 L297 279.1 L300.7 274.8 L300.1 270.8 L280.3 270.8 L276.5 278.5 L268.9 287.1 L245.8 281.8 L239.4 279.6 L232.5 279.7 L217.6 280.3 L208.8 288.2 L200.1 284 L198.8 281.2 L192.9 281.9 L190.6 264.9 L202.3 250.6 L204.5 245.9 L205.2 234.6 L199.8 217.7 L194.6 209.6 L188.4 185 Z" fill="#fdfdf9" stroke="#8da49d" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={markerX} cy={markerY} r="18" fill="var(--resort-color)" opacity=".18" />
        <circle cx={markerX} cy={markerY} r="8" fill="var(--resort-color)" stroke="#fff" strokeWidth="3" />
        <text x={markerX} y={markerY - 17} textAnchor="middle" fontSize="14" fontWeight="800" fill="#17231f">{resort.name}</text>
        <text x="35" y="350" fontSize="11" fill="#52615b">Natural Earth · geographic outline</text>
      </svg>
      <div className="rp-travel-times">{(page.travelTimes || []).map((row,i) => <div key={i}><strong>{row.city}</strong><span>{row.time || t("timePending")}</span></div>)}</div>
    </div>
    <div><h3>{t("gettingThere")}</h3><p>{page.arrivalText || resort.transport?.car || t("copyPending")}</p>
      {resort.transport?.transfer && <p>{resort.transport.transfer}</p>}
      {resort.transport?.routeUrl && <a className="rp-button" href={resort.transport.routeUrl} target="_blank" rel="noreferrer">{t("directions")} ↗</a>}
    </div>
  </div>;
}
