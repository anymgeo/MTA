"use client";

import { useState } from "react";
import { useSiteUI } from "@/app/SiteShell";
import { useSiteSeason } from "@/providers/SeasonProvider";
import Hero from "@/components/Hero";
import LiveMountainData from "@/components/LiveMountainData";
import ExploreResorts from "@/components/ExploreResorts";
import MountainMap from "@/components/MountainMap";
import Webcams from "@/components/Webcams";
import SafetySection from "@/components/SafetySection";
import Activities from "@/components/Activities";
import NewsSection from "@/components/NewsSection";

export default function HomePage({ resorts, activities, news, cameras }) {
  const { season } = useSiteSeason();
  const { setModal } = useSiteUI();

  const [resortIndex, setResortIndex] = useState(0);

  const current = resorts[resortIndex];

  return (
    <main
      className="
                min-h-screen
                bg-canvas
            "
    >
      <Hero
        season={season}
        current={current}
        resortIndex={resortIndex}
        setResortIndex={setResortIndex}
        setModal={setModal}
      />
      <Activities activities={activities} season={season} />

      <NewsSection news={news} />

      <LiveMountainData
        resorts={resorts}
      />

      <ExploreResorts resorts={resorts} setResortIndex={setResortIndex} />

      <MountainMap />

      <Webcams current={current} cameras={cameras} />

      <SafetySection />

    </main>
  );
}
