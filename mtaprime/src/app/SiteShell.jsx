"use client";

import { createContext, useContext, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchModal from "@/components/SearchModal";
import SkiPassModal from "@/components/SkiPassModal";
import { usePathname } from "@/i18n/navigation";

const SiteUIContext = createContext(null);

export function useSiteUI() {
  return useContext(SiteUIContext);
}

export default function SiteShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const pathname = usePathname();
  const resortSlug = /^\/resorts\/([^/]+)$/.exec(pathname)?.[1];

  return (
    <SiteUIContext.Provider value={{ setModal }}>
      <Header
        resortPage={!!resortSlug}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        setModal={setModal}
      />
      {children}
      <Footer setModal={setModal} />
      {modal === "search" && <SearchModal onClose={() => setModal(null)} />}
      {modal === "pass" && <SkiPassModal onClose={() => setModal(null)} />}
    </SiteUIContext.Provider>
  );
}
