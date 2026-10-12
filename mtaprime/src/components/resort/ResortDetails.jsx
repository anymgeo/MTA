"use client";
import Image from "@/components/media/SiteImage";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Mountain, Footprints, Bike, Camera, TentTree, CloudSnow, Plane, Utensils } from "lucide-react";
import SkipassCTA from "@/components/brand/SkipassCTA";
import { Link } from "@/i18n/navigation";
import { useSiteSeason } from "@/providers/SeasonProvider";
import ResortHero from "./ResortHero";
import ResortStats from "./ResortStats";
import RichText from "@/components/content/RichText";
import ResortGallery from "./ResortGallery";
import ResortIdentity from "./ResortIdentity";
import InteractiveTrailMap from "./InteractiveTrailMap";
import RecordList from "@/components/content/RecordList";
import ResortMotion from "./ResortMotion";
import InfrastructureTables from "./InfrastructureTables";
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
      <SkipassCTA variant="light" href={page.purchaseUrl || context.operations?.purchaseUrl || "https://status.mta.ski/en"}>{p("buySkipass")}</SkipassCTA>
      <Link className="rp-button secondary" href="/today">{p("today", { resort: resort.name })}</Link>
      <a className="rp-button secondary" href="#gallery"><Camera size={16} />{p("gallery")}</a>
    </nav>
    <section id="about" className="rp-section rp-wrap rp-about-section">
      <h2>{resort.name.split(/\s*(?:&|და)\s+/)[0]}</h2>
      <div className="rp-about-copy">{(page.about || resort.description || "").split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}><RichText text={paragraph} /></p>)}</div>
    </section>
    <ResortStats resort={resort} />
    <section id="lifts-trails" className="rp-section rp-wrap">
      <span className="rp-kicker">{p("mountainGuide")}</span><h2>{p("liftsTrails")}</h2>
      <div className="rp-infra-intro"><p>{page.infrastructureText || p("infrastructurePending")}</p>
        <Image width={1200} height={800} quality={75} sizes="(max-width: 768px) 100vw, 66vw" src={page.bannerImage || resort.seasons?.[season]?.image || resort.image} alt="" loading="lazy" /></div>
      <InfrastructureTables lifts={lifts} trails={trails} />
    </section>
    <section id="activities" className="rp-section rp-wrap"><span className="rp-kicker">{p("yourDay")}</span><h2>{p("activities")}</h2>
      <ul className="rp-activities">{activities.map((item,i) => { const Icon = icons[item.iconKey] || Mountain; return <li key={i}><Icon className="shrink-0" aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.text}</p></div></li>; })}</ul>
      {!activities.length && <p>{p("copyPending")}</p>}
    </section>
      {trailMap && <section id="terrain-map" className="rp-section rp-wrap"><h2>{p("interactiveMap")}</h2><InteractiveTrailMap map={trailMap} resortName={resort.name} resortSlug={resort.slug} /></section>}
    <section id="events" className="rp-section rp-wrap rp-events"><span className="rp-kicker">{resort.name}</span><h2>{p("events")}</h2><RecordList items={context.events} basePath="/events" filters={[]} /></section>
    <section id="gallery" className="rp-section"><ResortGallery resort={resort} /></section>
    <section id="meet" aria-label={meet("title", { resort: resort.name })}>
      <section id="skipass" className="relative isolate overflow-hidden bg-ink px-6 py-24 text-canvas md:px-10 lg:px-16 lg:py-32">
        <Image fill quality={75} sizes="(max-width: 768px) 100vw, 66vw"
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
            <SkipassCTA
              href={page.purchaseUrl || context.operations?.purchaseUrl || "https://status.mta.ski/en"}
              target="_blank"
              rel="noreferrer"
            >
              {t("buySkiPass_8f7678")}
            </SkipassCTA>
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

    <section id="downloads" className="rp-footer"><div className="rp-wrap"><div className="flex flex-wrap items-center justify-between gap-6"><div><h2 className="mb-6 text-3xl font-black">{meet("title", { resort: resort.name })}</h2><ResortIdentity resort={resort} /></div>
      {page.pdfUrl ? <a className="rp-button" href={page.pdfUrl} download>{p("pdfMap")} ↓</a> : <button className="rp-button" disabled>{p("pdfPending")}</button>}</div>
      <nav className="rp-footer-links" aria-label={p("socialLinks")}>{Object.entries(page.social || {}).filter(([,url]) => url).map(([key,url]) => <a key={key} href={url} target="_blank" rel="noreferrer">{p("social." + key)}</a>)}
        {!page.social?.tiktok && <span>{p("tiktokPending")}</span>}
      </nav><div className="rp-emergency"><Link href="/safety#emergency">{p("safety")}</Link>{context.contacts.map(contact => <a key={contact.id} href={`tel:${contact.phone}`}>{contact.title}: {contact.phone}</a>)}</div>
    </div></section>
    </section>
  </main>;
}
