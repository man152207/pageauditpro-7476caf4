

# Fix Sitemap.xml and Robots.txt

## Problem 1: Sitemap.xml returns 404
The `.htaccess` proxy rule (`[P]` flag) requires `mod_proxy` which is not enabled on the hosting server. The request falls through to React Router, which shows "Page not found".

**Fix**: Create a static `public/sitemap.xml` redirect page that uses JavaScript to fetch the edge function and serve the XML. However, this won't work for search engine crawlers since they don't execute JS.

**Better fix**: Add a dedicated route in the React app that fetches the sitemap from the edge function and renders it, OR create a build-time generated static `public/sitemap.xml` file. But the best solution for crawlers is:

**Recommended fix**: Since `mod_proxy` is unavailable, change the `Sitemap:` directive in `robots.txt` to point directly to the edge function URL, and also add a meta redirect in a static HTML file.

Specifically:
1. **Update `public/robots.txt`** — Change `Sitemap: https://pagelyzer.io/sitemap.xml` to `Sitemap: https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap`
   - Search engines will follow this URL directly and get valid XML
   
2. **Keep `public/sitemap.xml` as a fallback** — Replace it with a small XML file that includes a comment pointing to the real sitemap URL (for anyone who manually visits `/sitemap.xml`)

## Problem 2: Cloudflare overrides robots.txt
Cloudflare is injecting its own managed content that blocks AI crawlers (Google-Extended, GPTBot, etc.). Your custom rules appear below Cloudflare's blocks.

**Fix**: This is a Cloudflare configuration issue, not a code issue. You need to:
- Go to your Cloudflare dashboard → **AI Audit** or **Bots** settings → Disable the managed robots.txt injection
- OR accept that Cloudflare manages AI bot blocking (which is actually good for content protection)

Since Googlebot, Bingbot, Twitterbot, and facebookexternalhit are all explicitly `Allow: /` in both Cloudflare's and your rules, **SEO crawling is not affected**. The only bots being blocked are AI training bots.

**No code change needed for robots.txt** — the current behavior is actually correct for SEO purposes.

## Summary of Changes

### File: `public/robots.txt`
- Update `Sitemap:` line to point to the direct edge function URL so crawlers can always find the sitemap

### No other code changes needed
- The edge function is working correctly
- robots.txt SEO rules are fine (Googlebot, Bingbot allowed)
- Cloudflare AI bot blocking is a separate concern managed in Cloudflare dashboard

