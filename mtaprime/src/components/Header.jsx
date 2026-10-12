"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  ArrowRight,
  Menu,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import HeaderSnow from "./HeaderSnow";
import { useSiteSeason } from "@/providers/SeasonProvider";
import CmsNavigation from "./content/CmsNavigation";
import SeasonToggle from "./SeasonToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import SkiPassIcon from "./brand/SkiPassIcon";
export default function Header({ menuOpen, setMenuOpen, setModal, resortPage = false, navigation }) {
  const t = useTranslations("Header");
  const { season } = useSiteSeason();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!resortPage) return;
    const update = () => setScrolled(window.scrollY > 72);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [resortPage]);
  const closeMenu = () => {
    setMenuOpen(false);
  };
  return (
    <header data-resort-header={resortPage || undefined} data-scrolled={scrolled || menuOpen || undefined} className="fixed left-0 top-0 z-50 w-full border-b border-canvas/10 bg-ink/95 px-4 py-4 text-canvas backdrop-blur-xl sm:px-6 min-[1440px]:px-10">
      {season === "winter" && !resortPage && <HeaderSnow />}
      <div className="relative z-10 mx-auto grid h-16 max-w-[1600px] grid-cols-[auto_1fr] items-center gap-2 min-[1440px]:grid-cols-[auto_1fr_auto] min-[1440px]:gap-4">
        {/* LEFT - LOGO */}
        <div className="flex items-center justify-start">
          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="mr-1 rounded-full p-1 sm:mr-3 sm:p-2 transition hover:bg-canvas/10 min-[1440px]:hidden"
            aria-label={t("toggleMenu_520922")}
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" onClick={closeMenu} className="rounded-md p-1">
            <Image src="/brand/mta-official-light.svg" alt="M.T.A. Mountain Trails Agency" width={770} height={200} sizes="(max-width:640px) 116px, 150px" quality={75} className="site-header-logo h-auto w-[116px] sm:w-[150px]" />
          </Link>
        </div>

        {/* CENTER - NAVIGATION */}
        <nav
          id="site-navigation"
          className={`
            absolute left-0 top-full w-full border-t border-canvas/10
            max-h-[calc(100dvh-96px)] overflow-y-auto min-[1440px]:overflow-visible bg-ink/95 px-6 py-8 backdrop-blur-xl
            transition-all duration-300

            min-[1440px]:static
            min-[1440px]:w-auto
            min-[1440px]:border-0
            min-[1440px]:bg-transparent
            min-[1440px]:p-0
            min-[1440px]:backdrop-blur-none

            ${menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 min-[1440px]:visible min-[1440px]:translate-y-0 min-[1440px]:opacity-100"}
          `}
        >
          <div className="flex flex-col gap-6 min-[1440px]:flex-row min-[1440px]:items-center min-[1440px]:justify-center min-[1440px]:gap-4">
            <CmsNavigation items={navigation ?? []} onNavigate={closeMenu} />
          </div>
          <div className="mobile-nav-utilities">
            <button type="button" onClick={() => { closeMenu(); setModal('search'); }} className="site-nav-label"><Search size={18} aria-hidden="true" />{t('search_bce064')}</button>
            <div className="small-phone-season"><SeasonToggle /></div>
          </div>
        </nav>

        {/* RIGHT - ACTIONS */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {/* SEARCH */}
          <button
            type="button"
            onClick={() => setModal("search")}
            className="header-search-action rounded-full p-1 sm:p-2 transition hover:bg-canvas/10"
            aria-label={t("search_bce064")}
          >
            <Search size={19} />
          </button>

          <LanguageSwitcher />
          <div className="header-season-action"><SeasonToggle /></div>

          {/* SKI PASS */}
          <button
            type="button"
            onClick={() => setModal("pass")}
            aria-label={t("skiPass_7289e8")}
            className="brand-cta brand-cta-primary brand-cta-compact"
          >
            <SkiPassIcon />

            <span className="hidden sm:block">{t("skiPass_7289e8")}</span>
            <ArrowRight className="skipass-cta-arrow" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
