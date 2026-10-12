"use client";

import { ArrowRight } from "lucide-react";
import { useSiteSeason } from "@/providers/SeasonProvider";
import SkiPassIcon from "./SkiPassIcon";

/** Keeps the caller's native link or button behavior, including click handlers/tracking. */
export default function SkipassCTA({ children, href, variant = "default", className = "", ...props }) {
  const { season } = useSiteSeason();
  const Element = href ? "a" : "button";
  return <Element {...(!href ? { type: "button" } : {})} {...props} href={href}
    data-season={season} data-skipass-cta={variant}
    className={`skipass-cta skipass-cta--${variant} ${className}`}>
    <span className="skipass-cta__icon"><SkiPassIcon /></span>
    <span className="skipass-cta__label">{children}</span>
    <span className="skipass-cta__arrow"><ArrowRight size={18} aria-hidden="true" /></span>
  </Element>;
}
