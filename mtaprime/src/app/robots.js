import { env } from "@/config/env";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: env.siteUrl + "/sitemap.xml",
  };
}
