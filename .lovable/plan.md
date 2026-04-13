

# Fix Sitemap Production Delivery

## Changes

### 1. `vite.config.ts` — Move generation to `closeBundle` hook, write to `dist/`

Replace the `generateSitemap` plugin to use `closeBundle` instead of `buildStart`, writing directly to `dist/sitemap.xml`:

```ts
function generateSitemap(): Plugin {
  return {
    name: "generate-sitemap",
    apply: "build",
    async closeBundle() {
      try {
        const res = await fetch(SITEMAP_EDGE_URL, {
          headers: { Accept: "application/xml" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        writeFileSync("dist/sitemap.xml", xml, "utf-8");
        console.log("✅ sitemap.xml written to dist/ (dynamic)");
      } catch (err: any) {
        console.warn("⚠️ Edge function fetch failed, fallback will be used:", err.message);
        // fallback already copied from public/ by Vite — no action needed
      }
    },
  };
}
```

Key points:
- `closeBundle` runs after Vite has finished writing `dist/`, so the committed fallback from `public/` is already there
- If the edge function fetch succeeds, we overwrite with the dynamic version
- If it fails, the committed fallback remains untouched
- `apply: "build"` prevents running during dev server

### 2. `.gitignore` — Remove `public/sitemap.xml` exclusion

Delete line 25 (`public/sitemap.xml`) so the fallback file can be committed to Git.

### 3. `public/sitemap.xml` — Add committed fallback

Create a static XML sitemap with all known routes (home, pricing, features, FAQ, blog, contact, privacy, terms, data-deletion, sample-report). This file will always be copied to `dist/` by Vite, guaranteeing a valid sitemap exists even if the network fetch fails.

### 4. `package.json` — Add post-build verification

Change the build script to:
```
"build": "vite build && node scripts/verify-sitemap.mjs"
```

### 5. `scripts/verify-sitemap.mjs` — New verification script

A simple script that:
- Checks `dist/sitemap.xml` exists
- Verifies it starts with `<?xml`
- Logs success or exits with error code 1

### 6. `public/.htaccess` — Remove sitemap redirect rule

Remove the `RewriteRule ^sitemap\.xml$` line since it's not needed (Lovable hosting ignores `.htaccess`, and the file will be served statically).

## Why This Solves It

- **Fallback always exists**: committed `public/sitemap.xml` → Vite copies to `dist/` → always present
- **Dynamic upgrade**: `closeBundle` overwrites with full dynamic sitemap when possible
- **No SPA interference**: physical `.xml` file is served by the hosting layer before SPA fallback
- **No `.htaccess` dependency**: works on any static hosting
- **Build verification**: catches failures before deployment

