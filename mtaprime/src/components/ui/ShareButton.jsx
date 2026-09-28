"use client";

import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
export default function ShareButton({ title }) {
  const t = useTranslations("ShareButton");
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert(t("linkCopied_88fe9d"));
    }
  };
  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 border border-ink px-5 py-3 text-xs font-bold tracking-wider"
    >
      <Share2 size={16} />
      {t("share_dd19b8")}
    </button>
  );
}
