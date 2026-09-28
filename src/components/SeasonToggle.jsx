"use client";
import { useTranslations } from "next-intl";
import { Snowflake, Sun } from "lucide-react";
import { useSiteSeason } from "@/providers/SeasonProvider";
import SegmentedToggle from "./ui/SegmentedToggle";
export default function SeasonToggle(){
 const {season,setSeason}=useSiteSeason(),t=useTranslations('Common');
 return <SegmentedToggle label={t('season')} value={season} onChange={setSeason} options={[
 {value:'winter',label:t('winter'),icon:Snowflake,compact:true},
 {value:'summer',label:t('summer'),icon:Sun,compact:true}]}/>;
}
