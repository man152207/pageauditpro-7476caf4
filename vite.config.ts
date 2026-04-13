import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { writeFileSync } from "fs";

const SITEMAP_EDGE_URL =
  "https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap";

const SITEMAP_FALLBACK = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pagelyzer.io/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;

function generateSitemap(): Plugin {
  return {
    name: "generate-sitemap",
    apply: "build",
    async closeBundle() {
      try {
        const res = await fetch(SITEMAP_EDGE_URL, {
          headers: { Accept: "application/xml" },
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        writeFileSync("dist/sitemap.xml", xml, "utf-8");
        console.log("✅ sitemap.xml written to dist/ (dynamic)");
      } catch (err: any) {
        console.warn(
          "⚠️  Edge function fetch failed, fallback from public/ will be used:",
          err.message,
        );
        // fallback already copied from public/ by Vite — no action needed
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), generateSitemap()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
