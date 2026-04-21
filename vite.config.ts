import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function generateSitemap() {
  return {
    name: "generate-sitemap",
    apply: "build" as const,
    async closeBundle() {
      try {
        const res = await fetch(
          "https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const fs = await import("fs");
        const p = await import("path");
        const distDir = p.resolve("dist");
        if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
        fs.writeFileSync(p.resolve("dist/sitemap.xml"), xml);
        // eslint-disable-next-line no-console
        console.log("✓ sitemap.xml generated");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("sitemap generation failed:", e);
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
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && generateSitemap(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
