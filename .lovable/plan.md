

# Complete Deployable ZIP for cPanel — No Changes Needed After Upload

## What I'll Do

Generate a single `pagelyzer_cpanel_ready.zip` that you upload to `public_html/` on cPanel and it works immediately. No code editing, no configuration needed.

## The Challenge

Your React frontend currently calls Supabase SDK (`supabase.from()`, `supabase.auth.*`, `supabase.functions.invoke()`) and uses `import.meta.env.VITE_SUPABASE_URL` for edge function calls. These won't work with your PHP backend on cPanel.

## What I'll Build

### 1. New `src/integrations/supabase/client.ts` — Drop-in PHP API Wrapper

Instead of modifying 48 files, I'll **replace the single Supabase client file** with a wrapper that mimics the exact same API but routes to your PHP backend:

```text
supabase.from('audits').select('*').eq('user_id', id)  →  POST /api/data.php
supabase.auth.signUp(...)                               →  POST /api/auth.php?action=signup
supabase.auth.signInWithPassword(...)                   →  POST /api/auth.php?action=login
supabase.functions.invoke('run-audit', {body})          →  POST /api/run-audit.php
supabase.storage.from('blog-images').upload(...)        →  POST /api/upload.php
```

This means **zero changes to the other 47 files** — they keep importing `supabase` from the same path and calling the same methods.

### 2. Replace `VITE_SUPABASE_URL` References (5 files)

The 5 files that use `import.meta.env.VITE_SUPABASE_URL` directly for `fetch()` calls will be updated to use the PHP API base URL instead.

### 3. Build Production `dist/`

Run `npm run build` → production-ready static files.

### 4. Package Everything

```text
pagelyzer_cpanel_ready/
├── api/                     # PHP backend (already generated, with DB creds pre-filled)
│   ├── config.php           # DB: adsmpgco_Pagelyzer, User: adsmpgco_Pagelyzer, Pass: Unknown@112
│   ├── auth.php
│   ├── data.php
│   ├── middleware.php
│   ├── run-audit.php
│   ├── ... (all 29 PHP files)
│   └── upload.php
├── uploads/                 # Empty dir for file storage
├── index.html               # React app entry
├── assets/                  # JS/CSS bundles
├── favicon.png
├── og-image.png
├── robots.txt
├── .htaccess                # SPA routing + API rewrite
└── SETUP.md                 # Quick reference
```

## Upload Steps (after you get the ZIP)

```text
1. Go to cPanel → File Manager → pagelyzer.io/
2. Upload pagelyzer_cpanel_ready.zip
3. Extract it (right-click → Extract)
4. Done — visit https://pagelyzer.io
```

No editing needed. DB credentials are pre-filled. `.htaccess` routing is included.

## Files Modified in This Project

| File | Change |
|------|--------|
| `src/integrations/supabase/client.ts` | Replace with PHP API wrapper (same export interface) |
| `src/contexts/AuthContext.tsx` | Point fetch URLs to `/api/` |
| `src/hooks/useAudits.ts` | Point fetch URLs to `/api/` |
| `src/components/audit/AuditFlow.tsx` | Point fetch URLs to `/api/` |
| `src/pages/PublicReportPage.tsx` | Point fetch URL to `/api/` |

That's it — only 5 files need changes. The wrapper approach means all other 43 files work without modification.

## Output

Single ZIP file: `/mnt/documents/pagelyzer_cpanel_ready.zip` (~3-5MB)

