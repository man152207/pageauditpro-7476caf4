
Root cause is clear: your frontend is calling `/api/*.php` and expecting JSON, but the live site is returning an HTML 404 page instead. That is why you see:

```text
Unexpected token '<', '<!doctype' ... is not valid JSON
```

I verified that these live URLs currently return the website’s 404 HTML, not API JSON:

```text
https://pagelyzer.io/api/auth.php
https://pagelyzer.io/api/data.php
https://pagelyzer.io/api/check-subscription.php
https://pagelyzer.io/api/facebook-auth-login.php
```

So the problem is not the login form itself first — the PHP API is not reachable at the path the frontend uses.

## What I will fix next

1. Inspect the cPanel-ready package structure and make sure the ZIP extracts like this:
   ```text
   pagelyzer.io/
   ├── index.html
   ├── assets/
   ├── .htaccess
   ├── api/
   │   ├── auth.php
   │   ├── data.php
   │   ├── check-subscription.php
   │   ├── facebook-auth-login.php
   │   └── ...
   ```
   Not inside an extra nested folder.

2. Regenerate the package so Apache routing cannot swallow missing API files silently:
   - keep SPA fallback for React routes
   - explicitly preserve `/api/*.php`
   - ensure `.php` requests never fall through to `index.html`

3. Add safer frontend API handling:
   - detect non-JSON responses before calling `response.json()`
   - show a real message like:
     ```text
     API endpoint not found at /api/auth.php
     ```
     instead of the raw `Unexpected token '<'` error

4. Recheck auth flow compatibility:
   - email login → `/api/auth.php?action=login`
   - session restore → `/api/auth.php?action=session`
   - refresh → `/api/auth.php?action=refresh`
   - Facebook login → `/api/facebook-auth-login.php`

5. Produce a new cPanel package with corrected structure and routing so after upload/extract the API works immediately.

## Most likely deployment mistake right now

One of these is happening on the server:

- the ZIP extracted into an extra subfolder, so real path became:
  ```text
  /home/adsmpgco/pagelyzer.io/pagelyzer_cpanel_ready_v2/api/auth.php
  ```
  instead of:
  ```text
  /home/adsmpgco/pagelyzer.io/api/auth.php
  ```

- or `.htaccess` is redirecting missing `/api/*.php` requests to `index.html`
- or the API files were uploaded to a different root than the live domain

## Technical note

Because the browser receives HTML like:

```html
<!doctype html>...
```

the wrapper in `src/integrations/supabase/client.ts` fails at:

```ts
const data = await response.json();
```

So both email login and Facebook login can fail with the same symptom.

## Deliverable after approval

I will prepare a new package that is safer and truly upload-ready for cPanel:
- corrected folder layout
- corrected `.htaccess`
- corrected API path handling
- clearer frontend error handling for bad API responses
- updated ZIP for direct extract in `pagelyzer.io/`

