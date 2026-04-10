

# Pagelyzer Branding: Favicon + OG Image + Badge Cleanup

## Summary
Generate Pagelyzer-branded favicon and OG/thumbnail image using AI image generation, replace all Lovable references, and hide the Lovable badge.

## What Changes

### 1. Generate Favicon (AI Image Generation)
- Generate a simple, bold favicon icon using the Pagelyzer brand colors (Magenta/Purple `hsl(326, 55%, 42%)` + Green accent `hsl(86, 66%, 43%)`)
- Design: A stylized "P" or bar-chart icon on a purple background — matches the `BarChart3` icon used throughout the app
- Save as `public/favicon.png` (replace existing `favicon.ico`)

### 2. Generate OG/Thumbnail Image (AI Image Generation)  
- Create a 1200x630 OG image with:
  - Pagelyzer logo/brand name
  - Tagline: "Smart Facebook Page Audit Platform"
  - Purple-to-green gradient background matching brand colors
- Save to `public/og-image.png`

### 3. Update index.html
- Add `<link rel="icon" href="/favicon.png" type="image/png">`
- Change `og:image` from `https://lovable.dev/opengraph-image-p98pqg.png` → `/og-image.png`
- Change `twitter:image` similarly
- Delete old `public/favicon.ico`

### 4. Update Edge Functions (remove lovable.app references)
- `send-pro-welcome-email/index.ts`: Change `pageauditpro.lovable.app` → `pagelyzer.io`
- `send-audit-email/index.ts`: Change the `.lovable.app` fallback → `pagelyzer.io`

### 5. Hide Lovable Badge
- Use `publish_settings--set_badge_visibility` to hide the "Edit with Lovable" badge

## Files Modified
1. `public/favicon.png` — new generated favicon
2. `public/og-image.png` — new generated OG image
3. `index.html` — updated meta tags + favicon link
4. `supabase/functions/send-pro-welcome-email/index.ts` — fix URL
5. `supabase/functions/send-audit-email/index.ts` — fix URL
6. Delete `public/favicon.ico`

