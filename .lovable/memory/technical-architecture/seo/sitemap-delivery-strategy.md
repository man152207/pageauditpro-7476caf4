---
name: Sitemap delivery strategy
description: Real-time sitemap via .htaccess proxy to edge function, no build-time generation
type: feature
---
Sitemap is served real-time by proxying `/sitemap.xml` to the Supabase edge function via `.htaccess` RewriteRule with `[P,L]` flag. No static file is generated at build time. The Vite plugin `generateSitemap()` has been removed. New blog posts appear in the sitemap immediately without redeployment. This only works on cPanel with `mod_proxy`; Lovable preview hosting does not serve the sitemap.
