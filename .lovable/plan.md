

# Fix CI Build Failures

Two issues causing the GitHub Actions deployments to fail:

## Issue 1: Sitemap verification script still in build
**File**: `package.json` line 8
The build command still runs `node scripts/verify-sitemap.mjs`, which checks for `dist/sitemap.xml`. Since we switched to real-time sitemap via `.htaccess` proxy, this file no longer exists.

**Fix**: Change the build script from:
```
"build": "vite build && node scripts/verify-sitemap.mjs"
```
to:
```
"build": "vite build"
```

Also delete the now-unused scripts:
- `scripts/verify-sitemap.mjs`
- `scripts/generate-sitemap.mjs`

## Issue 2: CSS @import order violation
**File**: `src/index.css` line 11
The `@import url('https://fonts.googleapis.com/css2?...')` statement comes after `@tailwind` directives. CSS spec requires `@import` to precede all other statements.

**Fix**: Move the `@import` to line 1, before `@tailwind base`.

## Result
Both CI errors will be resolved. The build will succeed and deploy to cPanel.

