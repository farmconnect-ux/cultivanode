import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/en/sign-in", "/yo/sign-in", "/en/sign-up", "/yo/sign-up"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
