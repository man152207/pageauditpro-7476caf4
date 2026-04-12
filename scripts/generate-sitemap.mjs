/**
 * Build-time sitemap generator.
 * Fetches the dynamic sitemap from the edge function and writes it to dist/sitemap.xml.
 */
import { writeFileSync } from "fs";

const EDGE_URL =
  "https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap";

const FALLBACK = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pagelyzer.io/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;

async function main() {
  try {
    const res = await fetch(EDGE_URL, { headers: { Accept: "application/xml" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    writeFileSync("dist/sitemap.xml", xml, "utf-8");
    console.log("✅ sitemap.xml generated from edge function");
  } catch (err) {
    console.warn("⚠️  Edge function fetch failed, using fallback sitemap:", err.message);
    writeFileSync("dist/sitemap.xml", FALLBACK, "utf-8");
  }
}

main();
