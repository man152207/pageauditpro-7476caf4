

# Problem: Changes Not Reaching GitHub

The latest sitemap fixes (changes to `vite.config.ts`, `package.json`, `scripts/verify-sitemap.mjs`) have **not been pushed to GitHub** yet. The last GitHub Action was Apr 12 ("Add Facebook link tooltips"), but all the sitemap work happened after that.

**Why**: Lovable syncs to GitHub only when you click **Publish**. Until you publish, the code lives only inside Lovable's environment.

## Action Plan

### Step 1: Publish from Lovable
Click the **Publish** button (top-right on desktop) → click **Update**. This will:
1. Push all pending commits to GitHub (`main` branch)
2. Trigger the `Deploy to cPanel` GitHub Action automatically
3. The Action runs `npm run build` which now includes:
   - `closeBundle` hook that writes `dist/sitemap.xml` (dynamic or fallback)
   - `node scripts/verify-sitemap.mjs` post-build check
4. FTP deploys the `dist/` folder (including `sitemap.xml`) to cPanel

### Step 2: Verify after deploy
Once the Action completes (~1 min), I will fetch `https://pagelyzer.io/sitemap.xml` to confirm it returns valid XML.

### Step 3: Fallback — Add build logging (if needed)
If the Action fails, I will add a debug step in the GitHub Actions workflow to log whether `dist/sitemap.xml` exists before FTP upload:
```yaml
- name: Verify sitemap in dist
  run: |
    test -f dist/sitemap.xml && echo "✅ sitemap.xml found" || echo "❌ sitemap.xml MISSING"
    head -5 dist/sitemap.xml || true
```

**You need to click Publish now** — that is the only missing step. All the code changes are already done and ready.

