
Goal
- `https://pagelyzer.io/sitemap.xml` लाई browser मा पनि खुल्ने बनाउने, sitemap dynamic नै राख्ने।

What I verified
- custom-domain `sitemap.xml` अहिले React 404 page मा झरिरहेको छ
- live backend sitemap function भने valid XML दिइरहेको छ
- `public/robots.txt` already correct छ and direct dynamic sitemap source मा point गर्छ
- `public/.htaccess` मा sitemap rule अहिले `[P,L]` proxy use गरिरहेको छ
- त्यो proxy rule लाई `mod_proxy` चाहिन्छ; current host मा त्यो काम नगरेकोले request SPA fallback मा जाँदैछ
- `public/` भित्र actual `sitemap.xml` file छैन, त्यसैले अन्तिम result NotFound page हो

Implementation plan
1. `public/.htaccess` मा sitemap rule fix गर्ने
   - `RewriteRule ^sitemap\.xml$ ... [P,L]` लाई redirect-based rule मा बदल्ने
   - Recommended rollout: first `302` (`[R=302,L,NE]`) so bad cache stick नहोस्
   - यसले `mod_proxy` बिना पनि `/sitemap.xml` काम गराउँछ

2. `public/robots.txt` unchanged राख्ने
   - यो file already correct छ
   - crawlers ले direct dynamic sitemap source भेटिरहेका छन्

3. Small clarity cleanup
   - `src/pages/super-admin/settings/SEOSettings.tsx`
   - `src/pages/super-admin/settings/WebhooksSettings.tsx`
   - sitemap note/text update गरेर `/sitemap.xml` live dynamic sitemap मा resolve हुन्छ भनेर clear बनाउने
   - future confusion हट्छ

4. Deploy + verify
   - deploy पछि check गर्ने:
     - `https://pagelyzer.io/sitemap.xml` अब 404 नआउने
     - XML/redirect सही खुल्ने
     - `https://pagelyzer.io/robots.txt` मा sitemap line अझै correct रहने
   - यदि पुरानो 404 अझै देखियो भने Cloudflare cache purge चाहिन सक्छ

Technical details
- I will not create a static `public/sitemap.xml`, because that would stop this from being truly dynamic and can go stale
- `deploy-ftp.yml` already verifies that `.htaccess` is present in the build output, so no deployment-pipeline change should be needed
- If you want the browser address bar to stay exactly on `pagelyzer.io/sitemap.xml` while serving XML from the backend, that needs real proxy support at the host/Cloudflare layer; code-only fix can reliably do a redirect

Expected result
- `pagelyzer.io/sitemap.xml` opens
- sitemap remains dynamic
- crawlers and human visitors both reach the correct sitemap output
