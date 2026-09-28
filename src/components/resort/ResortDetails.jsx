"use client";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Ticket, Mountain, Footprints, Bike, Camera, TentTree, CloudSnow, Plane, Utensils } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSiteSeason } from "@/providers/SeasonProvider";
import ResortHero from "./ResortHero";
import ResortStats from "./ResortStats";
import ResortToday from "./ResortToday";
import ResortGallery from "./ResortGallery";
import ResortIdentity from "./ResortIdentity";
import GeorgiaJourney from "./GeorgiaJourney";
import InteractiveTrailMap from "./InteractiveTrailMap";
import RecordList from "@/components/content/RecordList";
import ResortMotion from "./ResortMotion";
import "./resort-page.css";
const icons = { skiing: Mountain, snowboarding: CloudSnow, hiking: Footprints, "mountain-biking": Bike, paragliding: Plane, camping: TentTree, food: Utensils, photography: Camera };
export default function ResortDetails({ resort, context, trailMap }) {
  const t = useTranslations("ResortDetails"), p = useTranslations("ResortPage");
  const meet = useTranslations("ResortMeet");
  const { season } = useSiteSeason();
  const page = resort.page || {}, lifts = page.liftList ?? resort.liftList, trails = page.trailList || [];
  const activities = page.activities ?? resort.experience?.[season] ?? [];
  return <main data-resort={resort.slug} className="resort-brand-page rp-page">
    <ResortMotion />
    <ResortHero key={`${resort.slug}:${page.videoUrl}:${page.videoWebmUrl}`} resort={resort} />
    <nav className="rp-ctas" aria-label={p("quickLinks")}>
      <a className="rp-button" href="#skipass"><Ticket size={16} />{p("buySkipass")}</a>
      <a className="rp-button secondary" href="#today">{p("today", { resort: resort.name })}</a>
      <a className="rp-button secondary" href="#gallery"><Camera size={16} />{p("gallery")}</a>
    </nav>
    <ResortStats resort={resort} />
    <section id="about" className="rp-section rp-wrap">
      <span className="rp-kicker">{resort.region}</span><h2>{p("about", { resort: resort.name })}</h2>
      <div className="rp-about"><div><p>{page.about || p("copyPending")}</p><div className="rp-facts"><h3>{p("facts")}</h3><p>{page.facts || p("copyPending")}</p></div></div>
        <div><h3>{p("history")}</h3><p>{page.history || p("copyPending")}</p></div></div>
      <GeorgiaJourney resort={resort} />
      <div className="rp-mountain-divider rp-mountain-accent" aria-hidden="true"><svg viewBox="0 0 600 90"><path d="M0 88 100 48 154 70 245 8 310 58 383 25 465 72 525 40 600 88Z" fill="currentColor" /></svg></div>
    </section>
    <section id="lifts-trails" className="rp-section rp-wrap">
      <span className="rp-kicker">{p("mountainGuide")}</span><h2>{p("liftsTrails")}</h2>
      <div className="rp-infra-intro"><p>{page.infrastructureText || p("infrastructurePending")}</p>
        <img src={page.bannerImage || resort.seasons?.[season]?.image || resort.image} alt="" loading="lazy" /></div>
      <div className="rp-tables">
        <div><h3>{p("lifts")}</h3><div className="rp-table-scroll"><table><thead><tr>{["name","type","duration","hours"].map(key => <th key={key} scope="col">{p(key)}</th>)}</tr></thead>
          <tbody>{lifts.map((lift,i) => <tr key={i}><th scope="row">{lift.name}</th><td>{lift.type}</td><td>{lift.duration || p("pending")}</td><td>{lift.hours}</td></tr>)}</tbody></table></div>{!lifts.length && <p>{p("copyPending")}</p>}</div>
        <div><h3>{p("trails")}</h3><div className="rp-table-scroll"><table><thead><tr>{["name","length","difficulty"].map(key => <th key={key} scope="col">{p(key)}</th>)}</tr></thead>
          <tbody>{trails.map((trail,i) => <tr key={i}><th scope="row">{trail.name}</th><td>{trail.length || p("pending")}</td><td><span className={`rp-difficulty ${trail.difficulty}`}>{p(trail.difficulty)}</span></td></tr>)}</tbody></table></div>
          {!trails.length && <p className="mt-4">{p("trailsPending")}</p>}
          <div className="mt-4 flex flex-wrap gap-2" aria-label={p("difficulty")}>{["easy","medium","difficult"].map(level => <span key={level} className={`rp-difficulty ${level}`}>{p(level)}</span>)}</div></div>
      </div>
      {trailMap && <details className="mt-10 rounded-xl border border-border p-5"><summary className="cursor-pointer font-bold">{p("interactiveMap")}</summary><div className="mt-5"><InteractiveTrailMap map={trailMap} resortName={resort.name} /></div></details>}
    </section>
    <section id="activities" className="rp-section rp-wrap"><span className="rp-kicker">{p("yourDay")}</span><h2>{p("activities")}</h2>
      <ul className="rp-activities">{activities.map((item,i) => { const Icon = icons[item.iconKey] || Mountain; return <li key={i}><Icon className="shrink-0" aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.text}</p></div></li>; })}</ul>
      {!activities.length && <p>{p("copyPending")}</p>}
    </section>
    <section id="events" className="rp-section rp-wrap rp-events"><span className="rp-kicker">{resort.name}</span><h2>{p("events")}</h2><RecordList items={context.events} basePath="/events" filters={[]} /></section>
    <ResortToday key={resort.id} resort={resort} />
      <section id="skipass" className="relative isolate overflow-hidden bg-ink px-6 py-24 text-canvas md:px-10 lg:px-16 lg:py-32">
        <img
          src={resort.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 -z-10 bg-ink/70" />
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-canvas/50">
              {t("georgiaMountainTrails_bc58dd")}
            </p>
            <h2 className="mt-5 text-6xl font-black leading-[.78] tracking-[-.07em] md:text-8xl">
              {t("seeYou_1c6f59")}
              <br />
              <span className="font-heading font-normal">
                {t("onTheMountain_bc026b")}
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={page.purchaseUrl || context.operations?.purchaseUrl || "https://status.mta.ski/en"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-canvas px-6 py-4 text-xs font-bold uppercase tracking-[.16em] text-ink transition hover:bg-border"
            >
              <Ticket size={16} />
              {t("buySkiPass_8f7678")}
            </a>
            <Link
              href={`/resorts/${resort.slug}/maps`}
              className="inline-flex items-center gap-3 border border-canvas/30 px-6 py-4 text-xs font-bold uppercase tracking-[.16em] transition hover:bg-canvas/10"
            >
              {t("exploreMaps_ddef1e")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    <section id="downloads" className="rp-footer"><div className="rp-wrap"><div className="flex flex-wrap items-center justify-between gap-6"><ResortIdentity resort={resort} />
      {page.pdfUrl ? <a className="rp-button" href={page.pdfUrl} download>{p("pdfMap")} ↓</a> : <button className="rp-button" disabled>{p("pdfPending")}</button>}</div>
      <nav className="rp-footer-links" aria-label={p("socialLinks")}>{Object.entries(page.social || {}).filter(([,url]) => url).map(([key,url]) => <a key={key} href={url} target="_blank" rel="noreferrer">{p("social." + key)}</a>)}
        {!page.social?.tiktok && <span>{p("tiktokPending")}</span>}
      </nav><div className="rp-emergency"><Link href="/safety#emergency">{p("safety")}</Link>{context.contacts.map(contact => <a key={contact.id} href={`tel:${contact.phone}`}>{contact.title}: {contact.phone}</a>)}</div>
    </div></section>
    <section id="meet" className="rp-section"><div className="rp-wrap"><h2>{meet("title", { resort: resort.name })}</h2></div><ResortGallery resort={resort} /></section>
  </main>;
}
