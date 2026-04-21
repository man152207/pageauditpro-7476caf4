

## समस्या के हो

`https://pagelyzer.io/sitemap.xml` ले अहिले `index.html` (React app) return गरिरहेको छ — XML होइन।

**Diagnosis:**
- ✅ Edge function `https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap` ठीकसँग XML return गर्दैछ (200, `content-type: application/xml`)
- ❌ `pagelyzer.io/sitemap.xml` को response: `content-type: text/html`, body `<!doctype html>...` (SPA fallback hit भयो)
- ❌ Server: **LiteSpeed** (`x-turbo-charged-by: LiteSpeed`), Apache होइन

**Root cause:** `.htaccess` को `RewriteRule [P,L]` flag ले `mod_proxy` चाहिन्छ। तपाईंको cPanel host LiteSpeed मा चलिरहेको छ, र **LiteSpeed le `[P]` proxy flag लाई natively support गर्दैन** (वा disable छ)। त्यसैले rule skip हुन्छ, अनि last SPA rule (`RewriteRule . /index.html [L]`) hit भएर HTML serve हुन्छ।

पहिले काम गरेको थियो किनभने त्यतिखेर sitemap **static file** (`dist/sitemap.xml`) को रूपमा build हुन्थ्यो — तर हालैको change ले Vite plugin हटायो र real-time edge-function proxy मा shift भयो। LiteSpeed मा proxy काम नगरेपछि sitemap broken भयो।

## Solution: Static sitemap.xml file को रूपमा deploy गर्ने

Real-time edge-function proxy LiteSpeed मा reliable नभएकोले, build time मा `dist/sitemap.xml` generate गर्ने Vite plugin पुन: add गर्ने। यो approach पहिले काम गर्थ्यो र FTP deploy सँग compatible छ।

### Changes

**1. `vite.config.ts`** — Custom plugin add गर्ने जसले `closeBundle` hook मा edge function लाई fetch गरेर `dist/sitemap.xml` लेख्छ:

```ts
function generateSitemap() {
  return {
    name: 'generate-sitemap',
    apply: 'build' as const,
    async closeBundle() {
      try {
        const res = await fetch('https://wrjqheztddmazlifbzbi.supabase.co/functions/v1/sitemap');
        const xml = await res.text();
        const fs = await import('fs');
        const path = await import('path');
        fs.writeFileSync(path.resolve('dist/sitemap.xml'), xml);
        console.log('✓ sitemap.xml generated');
      } catch (e) { console.error('sitemap generation failed:', e); }
    },
  };
}
// plugins: [react(), generateSitemap()]
```

**2. `public/.htaccess`** — Sitemap proxy rule हटाउने (अब static file छ, fallback ले serve गर्छ)। Stripe/Facebook/eSewa webhook rules नछुने — ती POST endpoints हुन् जुन Cloudflare/cPanel ले separately handle गर्न सक्छ, तर ती पनि शायद broken छन्। तर अहिले scope sitemap मात्र।

**3. `.github/workflows/deploy-ftp.yml`** — Verify step मा `dist/sitemap.xml` exists check पनि add गर्ने (optional safety)।

### Trade-off

- Static file: blog post add गरेपछि sitemap update हुन **redeploy** चाहिन्छ (GitHub Actions trigger)। Real-time होइन।
- तर LiteSpeed मा यो एक मात्र reliable approach हो।

### Webhook proxy rules बारे चेतावनी

`api/webhooks/stripe`, `api/webhooks/facebook`, `api/payments/esewa/success` पनि उही `[P]` flag प्रयोग गर्छन् — यिनीहरू पनि LiteSpeed मा शायद काम गरिरहेका छैनन्। यो plan ले sitemap मात्र fix गर्छ। Webhooks को लागि छुट्टै approach चाहिन्छ (जस्तै Stripe/Facebook dashboard मा directly Supabase URL configure गर्ने)। यदि चाहनुहुन्छ भने पछि छुट्टै plan बनाउँछु।

