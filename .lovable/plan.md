

# Fix: Fully Working cPanel Package (Login + All Functions)

## Root Causes of Login Failure

1. **`AuthContext.tsx` imports `User, Session` from `@supabase/supabase-js`** — This npm package may not be installed or the types won't match the PHP response format. The build may succeed but runtime breaks.

2. **`onAuthStateChange` event mismatch** — The wrapper fires `INITIAL_SESSION` on page load, but `AuthContext` only reacts to `SIGNED_IN` and `TOKEN_REFRESHED`, so existing sessions never restore.

3. **PHP `auth.php` missing actions** — The `session` and `refresh` actions are likely not implemented, so `getSession()` calls fail silently → user appears logged out → redirect to `/auth`.

4. **PHP `auth.php` response format** — Must return `session.user.id`, `session.user.email`, `session.access_token`, `session.expires_at` in the exact shape the AuthContext expects.

5. **PHP JWT implementation** — The secret key in `config.php` must work without external libraries (no Composer on most shared hosting). Need a simple HMAC-SHA256 JWT implementation built-in.

## What I'll Fix

### 1. `src/contexts/AuthContext.tsx`
- Remove `import { User, Session } from '@supabase/supabase-js'`
- Define local `User` and `Session` interfaces matching what PHP returns
- Add `INITIAL_SESSION` to the event handler so page-load sessions restore properly

### 2. Regenerate ALL PHP backend files (29 files)
Complete, tested PHP files with:
- **`config.php`**: Pre-filled DB credentials, built-in JWT encode/decode (no Composer needed)
- **`auth.php`**: All 6 actions: `signup`, `login`, `logout`, `session`, `refresh`, `verify-otp`
- **`middleware.php`**: JWT validation using same built-in functions
- **`data.php`**: Full CRUD handler with all filter types
- **`check-subscription.php`**: Working subscription check
- **`run-audit.php`**: Facebook Graph API audit with cURL
- All other 23 PHP files with proper CORS headers and error handling

### 3. `.htaccess` for `pagelyzer.io/`
- SPA routing (all non-file routes → `index.html`)
- No proxy rules (PHP is local, not proxied)

### 4. Build & Package
- `npm run build` → `dist/` folder
- Package into `pagelyzer_cpanel_ready_v2.zip`:
```text
pagelyzer.io/
├── api/                    # 29 PHP files (all pre-configured)
├── uploads/                # Empty dir for file storage
├── index.html              # React app
├── assets/                 # JS/CSS bundles
├── .htaccess               # SPA routing
└── SETUP.md                # Quick reference
```

### 5. Upload instructions
```text
1. cPanel → File Manager → pagelyzer.io/
2. Delete existing files (keep api/ if you want to preserve)
3. Upload pagelyzer_cpanel_ready_v2.zip
4. Extract
5. Visit https://pagelyzer.io → login should work
```

## Files Modified

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Remove `@supabase/supabase-js` import, add local types, handle `INITIAL_SESSION` |
| 29 PHP files in `/mnt/documents/` | Regenerated with proper JWT, session handling, CORS |
| `.htaccess` | Clean SPA routing |

## Output
`/mnt/documents/pagelyzer_cpanel_ready_v2.zip` — upload directly to `pagelyzer.io/` folder

