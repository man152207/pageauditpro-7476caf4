
## Why this build failed

I checked the current codebase, and the files are already fixed here:

- `package.json` now has:
  ```json
  "build": "vite build"
  ```
- `src/index.css` already starts with the Google Fonts `@import`
- `.github/workflows/deploy-ftp.yml` only verifies `dist/` and `dist/.htaccess`

So the GitHub Actions log you shared is not using this updated state. It is running an older commit/version where:

- `package.json` still had:
  ```json
  "build": "vite build && node scripts/verify-sitemap.mjs"
  ```
- `src/index.css` still had the font `@import` below Tailwind directives

## What the log means

1. **Actual failure**
   - `❌ dist/sitemap.xml is missing!`
   - This is the real reason the job exited with code 1.
   - The old sitemap verification script is still being executed in that GitHub build.

2. **Secondary warning**
   - `[vite:css] @import must precede all other statements`
   - This comes from the old CSS order.
   - Vite still completed the build, so this is not what stopped deployment.

3. **Unrelated warning**
   - `Node.js 20 actions are deprecated`
   - This is only a future compatibility warning, not today’s failure.

## Root cause

Most likely one of these is true:

- the CI-fix commit was not actually pushed to GitHub `main`
- the failing workflow run belongs to an earlier commit before the fix
- GitHub is building a branch/commit that still contains the old files

## Fix plan

1. Verify the GitHub repo’s `main` branch contains these exact changes:
   - `package.json` → `"build": "vite build"`
   - `src/index.css` → `@import` moved to the first line
   - `scripts/verify-sitemap.mjs` removed
   - `scripts/generate-sitemap.mjs` removed

2. Push/sync those files if GitHub still shows the old versions.

3. Re-run the workflow after that commit is on `main`.

4. Optional cleanup after deploy is green:
   - update workflow actions later for Node 24 support to remove the deprecation warning

## Technical note

Because the log still shows:
```bash
> vite build && node scripts/verify-sitemap.mjs
```
the checked-out GitHub commit definitely still had the old `package.json`. If GitHub had the latest fixed file, that line would simply be:
```bash
> vite build
```
