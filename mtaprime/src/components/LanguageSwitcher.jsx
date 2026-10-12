"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import SegmentedToggle from "./ui/SegmentedToggle";
export default function LanguageSwitcher() {
 const locale=useLocale(),t=useTranslations("Common"),pathname=usePathname(),router=useRouter();
 const [pending,startTransition]=useTransition();
 return <SegmentedToggle label={t("language")} value={locale} disabled={pending}
 options={[{value:'ka',label:'ქარ'},{value:'en',label:'ENG'}]}
 onChange={nextLocale=>{if(nextLocale===locale)return;startTransition(()=>router.replace(pathname+window.location.search+window.location.hash,{locale:nextLocale,scroll:false}));}}/>;
}
