

# Fix: Sitemap.xml — Write to `public/` before build

## Problem
The `closeBundle` Vite plugin writes `sitemap.xml` to `dist/` **after** the build completes, but Lovable's deploy pipeline likely snapshots `dist/` before this hook fires. The file never makes it into the deployed artifact.

Both `pagelyzer.io/sitemap.xml` and `pageauditpro.lovable.app/sitemap.xml` return React's 404 page, confirming the physical file is missing from the deployment.

## Solution
Change the Vite plugin to write `sitemap.xml` into the `public/` folder during the `buildStart` hook (runs **before** Vite copies `public/` to `dist/`). Vite always copies everything from `public/` into `dist/` — this is guaranteed behavior.

## Changes

### 1. `vite.config.ts` — Change hook from `closeBundle` to `buildStart`
- Write the fetched XML to **`public/sitemap.xml`** instead of `dist/sitemap.xml`
- Use `buildStart` hook so the file exists before Vite copies `public/` → `dist/`

### 2. `.gitignore` — Add `public/sitemap.xml`
- Since the file is auto-generated, it should not be committed to Git

### 3. No other changes needed
- `robots.txt` already points to `https://pagelyzer.io/sitemap.xml`
- Edge function and standalone script remain as-is

## Why this will work
- Vite **always** copies `public/*` to `dist/` — this is core Vite behavior, not dependent on any hosting platform
- `buildStart` runs before file emission, so the sitemap will be in `public/` when Vite copies it
- Works on Lovable hosting, cPanel (via GitHub Actions), and local builds

## After implementation
- Publish the site
- Purge Cloudflare cache
- Verify `https://pagelyzer.io/sitemap.xml` returns XML

