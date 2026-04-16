

# Full PHP Backend Migration for cPanel Hosting

## Reality Check

This is a **very large project**. Your app currently has:

- **20 Edge Functions** (server-side logic) that need PHP rewrites
- **40+ files** with direct database queries (Supabase SDK calls)
- **Authentication system** (signup, login, session management, Facebook OAuth)
- **File storage** (post-media, blog-images buckets)
- **Webhooks** (Stripe, Facebook, PayPal)
- **Cron jobs** (auto-audit, weekly emails)

All of this needs to be converted from Supabase/Deno to PHP/MariaDB. This is essentially rebuilding the entire backend.

## What I'll Generate

### Phase 1: PHP Backend API (priority)

**File: `api/config.php`** — Database connection to `adsmpgco_Pagelyzer`
```text
- MariaDB connection using PDO
- DB host, user, password as constants
- Session/JWT configuration
```

**File: `api/auth.php`** — Authentication endpoints
```text
- POST /api/auth.php?action=signup
- POST /api/auth.php?action=login
- POST /api/auth.php?action=logout
- JWT token generation (using firebase/php-jwt or simple session)
- Password hashing with password_hash()
```

**File: `api/middleware.php`** — Auth middleware
```text
- JWT/session validation
- Role checking (is_super_admin, has_role, is_admin_or_above)
```

**20 PHP API files** replacing each edge function:
```text
api/check-subscription.php
api/run-audit.php
api/get-audit-report.php
api/get-public-report.php
api/facebook-oauth.php
api/facebook-auth-login.php
api/facebook-webhook.php
api/create-checkout.php
api/stripe-webhook.php
api/paypal-checkout.php
api/esewa-checkout.php
api/generate-ai-insights.php
api/generate-pdf-report.php
api/share-report.php
api/schedule-post.php
api/publish-scheduled-posts.php
api/send-audit-email.php
api/send-pro-welcome-email.php
api/weekly-email-cron.php
api/admin-delete-user.php
api/seed-test-users.php
api/sitemap.php
```

### Phase 2: Frontend Modifications

**New file: `src/lib/api.ts`** — Replace Supabase SDK with fetch calls
```text
- apiClient class wrapping fetch() to /api/*.php endpoints
- Auth token management (localStorage JWT)
- Replaces all supabase.functions.invoke() calls
- Replaces all supabase.from().select/insert/update/delete() calls
- Replaces supabase.auth.* calls
```

**Modify 40+ files** — Replace every `supabase.*` call with `apiClient.*`

### Phase 3: File Upload Handling

**File: `api/upload.php`** — File storage
```text
- Handle image uploads to cPanel filesystem (public_html/uploads/)
- Return public URLs
- Replace Supabase Storage bucket calls
```

### Phase 4: Deployment Package

**Output: `/mnt/documents/pagelyzer_cpanel_package.zip`**
```text
pagelyzer_cpanel/
├── api/                    # All PHP backend files
│   ├── config.php          # DB connection (user fills credentials)
│   ├── auth.php
│   ├── middleware.php
│   ├── ...20 API files...
│   └── upload.php
├── uploads/                # Empty dir for file storage
├── dist/                   # Built React frontend
│   ├── index.html
│   ├── assets/
│   └── .htaccess           # SPA routing
├── .htaccess               # Root rewrite rules
└── SETUP.md                # Step-by-step setup guide
```

### Phase 5: Setup Instructions (SETUP.md)

```text
1. Upload zip contents to public_html/ via cPanel File Manager
2. Edit api/config.php with your MariaDB credentials:
   - DB_HOST: localhost
   - DB_NAME: adsmpgco_Pagelyzer
   - DB_USER: cpses_adiafxm1yu
   - DB_PASS: (your password)
3. Database is already imported (done)
4. Set file permissions: api/ folder 755, uploads/ folder 777
5. Update .env values in dist/ for API base URL
6. Test: visit yourdomain.com — should load the app
```

## Important Notes

- **Facebook App Settings**: You'll need to update Facebook App's redirect URIs to point to your cPanel domain
- **Stripe/PayPal Webhooks**: Need to update webhook URLs in their dashboards
- **Cron Jobs**: Set up cPanel cron jobs for auto-audit and weekly emails
- **SSL**: cPanel domain must have SSL for OAuth and payment webhooks
- **API Keys**: Your `settings` table already has the keys — PHP will read from MariaDB directly

## Estimated Output

The zip file will be ~2-5MB containing all PHP backend files, built frontend, and configuration. This is a complete self-hosted package.

