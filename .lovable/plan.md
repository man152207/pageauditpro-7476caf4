

# Fix: Sitemap.xml — Vite Plugin approach

## Problem
`scripts/generate-sitemap.mjs` runs as a **post-build shell command** (`vite build && node scripts/...`). Lovable's internal build system likely runs only `vite build` directly and ignores the `&&` chain. So `sitemap.xml` never appears in the build output on Lovable hosting.

The `.htaccess` redirect also doesn't work because Lovable hosting ignores `.htaccess` files.

## Solution
Move the sitemap generation **inside** `vite build` itself as a **Vite plugin**. This guarantees it runs regardless of how the build is triggered (Lovable, GitHub Actions, or local).

### Changes

**1. `vite.config.ts` — Add a custom Vite plugin**

Add a `generateSitemap()` plugin that runs in the `closeBundle` hook (fires at the end of every build). It fetches the XML from the edge function and writes `dist/sitemap.xml`, with a fallback if the fetch fails.

**2. `package.json` — Revert build script**

Change back to `"build": "vite build"` since the plugin handles sitemap generation internally.

**3. `scripts/generate-sitemap.mjs` — Keep as-is**

Keep the standalone script for manual use / cPanel GitHub Actions, but the Vite plugin is the primary mechanism now.

### Why this works
- Vite plugins run as part of `vite build` itself — no shell chaining needed
- Works on Lovable hosting, cPanel (via GitHub Actions), and local builds
- The `closeBundle` hook runs after all files are written to `dist/`, so the sitemap file will be included in the final output

### Expected result
After publishing: `https://pagelyzer.io/sitemap.xml` serves valid XML on both Lovable hosting and cPanel.

