import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/system",
          "/*/dashboard",
          "/*/users",
          "/*/managers",
          "/*/reports",
          "/*/settings",
          "/*/profile",
        ],
      },
    ],
    sitemap: "http://assignal.net/sitemap.xml",
  };
}
