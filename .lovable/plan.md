

# Make Sitemap Real-Time

## What Changes
Instead of serving a static `sitemap.xml` file generated at build time, we'll proxy `/sitemap.xml` requests directly to the Supabase edge function. This means every time Google (or anyone) requests the sitemap, they get the latest data — including newly published blog posts, without needing to redeploy.

## Steps

### 1. Update `.htaccess` — add sitemap proxy rule
Add a rewrite rule before the static file check so `/sitemap.xml` is proxied to the edge function:
```
RewriteRule ^sitemap\.xml$ https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap [P,L]
```
This goes before the "If requesting an actual existing file" block.

### 2. Remove build-time sitemap generation
- Remove the `generateSitemap()` Vite plugin from `vite.config.ts`
- Remove the sitemap fallback constant and related imports
- Keep `scripts/verify-sitemap.mjs` removal or make it optional

### 3. Update `deploy-ftp.yml` — remove sitemap check
Remove the `test -f dist/sitemap.xml` verification line from the "Verify build output" step, since sitemap.xml will no longer be a static file.

### 4. Keep edge function as-is
The `supabase/functions/sitemap/index.ts` already generates dynamic XML with blog posts, page SEO routes, and public reports. No changes needed.

## Result
- New blog post publish → immediately appears in sitemap
- No redeploy needed for sitemap updates
- Google crawlers always get fresh data

## Note
This only works on cPanel (which has `mod_proxy`). On Lovable hosting (`*.lovable.app`), the sitemap won't be available since `.htaccess` isn't processed there. If needed for Lovable hosting too, we can keep generating a static fallback at build time as a backup.

