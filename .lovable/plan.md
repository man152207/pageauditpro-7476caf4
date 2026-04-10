
Diagnosis

- तपाईंले देखाएको PayPal app "Live PayPal account" हो, त्यसैले `Sandbox Mode (Testing)` OFF हुनुपर्छ.
- अहिलेको UI मा `Test Connection` ले screen मा देखिएको unsaved value होइन, database मा save भएको value test गर्छ. त्यसैले switch OFF गरेपछि `Save` नगरी `Test Connection` थिच्दा पुरानै mode/secret प्रयोग हुन सक्छ.
- कोडमा अर्को important bug पनि छ: global settings `scope_id = null` सहित `upsert` भइरहेको छ, तर `(scope, scope_id, key)` uniqueness ले `NULL` rows लाई reliably conflict मान्दैन. यसले एउटै PayPal key/mode का duplicate rows बन्न सक्छ, र edge function ले random/old value पढ्न सक्छ. यही कारणले `INVALID_CREDENTIALS` बारम्बार आउन सक्छ.

Immediate fix to try right now

1. PayPal section मा `Sandbox Mode (Testing)` OFF गर्नुहोस्.
2. त्यही Live app बाट आएको `Client ID` र `Secret Key` दुबै paste गर्नुहोस्.
3. `Save` क्लिक गर्नुहोस्.
4. त्यसपछि मात्रै `Test Connection` क्लिक गर्नुहोस्.

Implementation plan

1. Fix the PayPal settings UX
- `src/components/settings/IntegrationSettings.tsx`
- PayPal setting change भएपछि `dirty` state track गर्ने
- dirty हुँदा `Test Connection` disable गर्ने वा `Save first` message देखाउने
- helper text थप्ने: `Live credentials = Sandbox OFF`, `Sandbox credentials = Sandbox ON`

2. Fix global settings persistence at the database level
- New migration for `public.settings`
- existing duplicate global setting rows cleanup गर्ने (latest row मात्र राख्ने)
- current nullable uniqueness replace गरेर global settings को uniqueness reliable बनाउने
- best fix: `scope, scope_id, key` मा `NULLS NOT DISTINCT` unique constraint/index use गर्ने, जसले `scope_id = null` भएको global settings मा real upsert काम गराउँछ

3. Make reads deterministic even if old duplicates exist
- `src/pages/super-admin/settings/IntegrationsSettings.tsx`
- `supabase/functions/paypal-checkout/index.ts`
- settings fetch गर्दा latest `updated_at` row per key मात्र use गर्ने fallback logic राख्ने
- यसले stale `paypal_sandbox_mode` वा old `paypal_client_secret` accidentally read हुने सम्भावना हटाउँछ

4. Improve PayPal debugging output
- `supabase/functions/paypal-checkout/index.ts`
- PayPal token request fail हुँदा upstream HTTP status/log capture गर्ने
- error response मा current mode (`live`/`sandbox`) include गर्ने
- generic `INVALID_CREDENTIALS` मात्र नदिई clearer message दिने, जस्तै saved mode mismatch वा stale saved settings

5. Verify full live flow
- Integrations page मा `Save` → `Test Connection`
- Billing page बाट actual PayPal checkout start गरेर approval URL आउँछ कि verify गर्ने
- PayPal callback redirect सही आउँछ कि test गर्ने
- साथै function मा hardcoded `https://pagelyzer.io` return domain तपाईंको real live domain सँग मिल्छ कि verify गर्ने; credentials fix भएपछि यो next issue बन्न सक्छ

Files involved

- `src/components/settings/IntegrationSettings.tsx`
- `src/pages/super-admin/settings/IntegrationsSettings.tsx`
- `supabase/functions/paypal-checkout/index.ts`
- new migration for `public.settings`

Technical note

- त्यसैले छोटो answer: हो, तपाईं live credential use गर्दै हुनुहुन्छ भने `Sandbox Mode` OFF गर्नुपर्छ.
- तर code-level हिसाबले toggle मात्रै change गर्नु काफी नहुन सक्छ, किनकि current global settings upsert/read logic ले पुरानो saved mode/secret पढिरहेको हुन सक्छ.
