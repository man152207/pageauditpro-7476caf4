

# Fix: Sitemap.xml on Lovable Hosting

## Root Cause
`pagelyzer.io` resolves to Lovable hosting (`pageauditpro.lovable.app`), NOT to the cPanel server. Lovable hosting:
- Does NOT process `.htaccess` files
- Treats paths with file extensions (like `.xml`) as static asset requests
- Returns 404 if the file doesn't exist in the build output

The `.htaccess` redirect fix was correct for cPanel but irrelevant here.

## Solution

Generate a static `sitemap.xml` at build time by calling the edge function during the build step.

### Step 1: Add a build script to fetch and save sitemap

Create `scripts/generate-sitemap.mjs` that:
- Calls the Supabase edge function (`/functions/v1/sitemap`)
- Saves the XML response to `dist/sitemap.xml`
- Falls back to a minimal valid sitemap if the fetch fails

### Step 2: Update `package.json` build command

Change `"build": "vite build"` to:
```
"build": "vite build && node scripts/generate-sitemap.mjs"
```

This ensures every publish generates a fresh `sitemap.xml` in the `dist/` folder.

### Step 3: Update `robots.txt`

Keep the `Sitemap:` line pointing to `https://pagelyzer.io/sitemap.xml` (the static file will now exist).

### Step 4: Revert unnecessary `.htaccess` sitemap rule

The redirect rule is harmless but misleading since it's not used on Lovable hosting. Add a comment clarifying this.

## Why not a `public/sitemap.xml` static file?
A static file in `public/` would go stale. The build-time generation ensures fresh data from the database on every publish while still serving a real `.xml` file.

## Result
- `https://pagelyzer.io/sitemap.xml` will serve valid XML (static file generated at build time)
- Content refreshes on every Publish
- No server-side redirect or proxy needed

