"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
export default function NavSection({ title, items, onNavigate }) {
  const [open, setOpen] = useState(false),
    t = useTranslations("Portal");
  return (
    <div
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium"
      >
        {title}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="pt-3 min-[1440px]:absolute min-[1440px]:left-0 min-[1440px]:top-full min-[1440px]:z-50">
          <div className="max-h-[65vh] min-w-56 max-w-sm overflow-y-auto rounded-xl border border-canvas/10 bg-ink/95 p-2 shadow-2xl backdrop-blur-xl">
            {items.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
                className="block rounded-lg px-4 py-3 text-sm hover:bg-canvas/10"
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
