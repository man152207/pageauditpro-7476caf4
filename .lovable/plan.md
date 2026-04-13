

# Debug .htaccess Sitemap Redirect

## Diagnosis

The `.htaccess` redirect rule on line 11 is **correct**:
```
RewriteRule ^sitemap\.xml$ https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap [R=302,L,NE]
```

This should issue a 302 redirect before the SPA fallback ever fires. Yet `/sitemap.xml` returns HTML. Two likely causes:

### Cause 1: Cloudflare Cache (most likely)
Your `robots.txt` confirms Cloudflare is actively proxying traffic (it prepends its managed bot rules). Cloudflare likely cached the old HTML 404 response for `/sitemap.xml` **before** the redirect rule was added to `.htaccess`.

### Cause 2: Latest .htaccess not deployed
The GitHub Actions workflow deploys `dist/` via FTPS. If the last deploy failed or hasn't run since the rule was added, the old `.htaccess` (without the sitemap rule) is still on cPanel.

## Fix Steps (no code changes needed)

### Step 1: Verify latest deploy ran
- Go to your GitHub repo → **Actions** tab
- Check the most recent "Deploy to cPanel" run succeeded
- If it failed or hasn't run, trigger it manually via **workflow_dispatch**

### Step 2: Purge Cloudflare cache
1. Cloudflare Dashboard → `pagelyzer.io` zone → **Caching** → **Configuration**
2. Click **Custom Purge** → enter `https://pagelyzer.io/sitemap.xml`
3. Purge it

### Step 3: Test
- Open `https://pagelyzer.io/sitemap.xml` in an incognito window
- It should now 302-redirect to the Supabase edge function and show XML
- If it still shows HTML, try **Purge Everything** in Cloudflare

### Step 4: Re-submit to Google Search Console
- Go to Google Search Console → Sitemaps
- Re-submit `https://pagelyzer.io/sitemap.xml`

## Why This Will Work
- The redirect rule has correct syntax and is positioned before the SPA fallback
- The Supabase edge function is confirmed working (tested earlier)
- Once Cloudflare serves the fresh 302 response, Google will follow the redirect and receive valid XML

## No code changes required
This is a cache/deployment verification issue, not a code issue.

