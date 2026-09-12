import type { MetadataRoute } from "next";
import { site, tools } from "@/lib/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...tools
      .filter((t) => t.status === "live")
      .map((t) => ({
        url: `${site.url}/tools/${t.slug}/`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
  ];
}
