

# Comprehensive SEO System — Per-Page SEO + Blog with "See More"

## Problem
- `useApplySEO` hook exists but is **never used** on any page
- No per-page SEO content management (title, description, keywords per route)
- No blog system exists
- No structured data per page type
- SEO content on pages needs a "See More" truncation pattern (10-15 words visible, rest behind button)

## Plan

### 1. Database: Create `page_seo` table
New migration to store per-page SEO content:

```sql
CREATE TABLE public.page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT UNIQUE NOT NULL,        -- e.g. '/', '/features', '/pricing'
  title TEXT,
  description TEXT,
  keywords TEXT,
  og_image TEXT,
  seo_content TEXT,                   -- rich SEO text block shown on page
  schema_type TEXT DEFAULT 'WebPage',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public read, admin write
ALTER TABLE public.page_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read page_seo" ON public.page_seo FOR SELECT USING (true);
CREATE POLICY "Admins can manage page_seo" ON public.page_seo FOR ALL USING (public.is_admin_or_above(auth.uid()));

-- Seed defaults for all marketing pages
INSERT INTO public.page_seo (route, title, description, keywords, seo_content) VALUES
  ('/', 'Pagelyzer - Smart Facebook Page Audit Platform', 'Get instant page health scores, engagement analysis, and AI-powered recommendations to grow your Facebook presence.', 'facebook audit, page analysis, social media audit, engagement analysis, AI recommendations, facebook insights, page health score', 'Pagelyzer is the leading Facebook Page audit platform that provides instant health scores, deep engagement analysis, and AI-powered recommendations. Whether you are a small business owner, social media manager, or digital marketing agency, Pagelyzer helps you understand exactly what is working on your Facebook Page and what needs improvement. Our smart audit engine analyzes your posting patterns, audience engagement, content performance, and page completeness to deliver actionable insights you can implement immediately.'),
  ('/features', 'Features - Pagelyzer Facebook Audit Tools', 'Explore all free and pro features including AI insights, engagement charts, demographic analysis, and automated audits.', 'facebook audit features, AI insights, engagement charts, demographic analysis, automated audits, content planner', 'Discover the full suite of Pagelyzer audit tools designed to maximize your Facebook Page performance. From real-time engagement tracking to AI-powered content recommendations, every feature is built to help you grow your audience faster and smarter.'),
  ('/pricing', 'Pricing Plans - Pagelyzer', 'Choose the right plan for your needs. Free audits available. Pro plans with advanced AI insights, unlimited audits, and priority support.', 'pagelyzer pricing, facebook audit pricing, free audit, pro plan, social media audit cost', 'Find the perfect Pagelyzer plan for your business. Start with our free tier to experience the power of automated Facebook audits, then upgrade to Pro for unlimited audits, AI insights, demographic breakdowns, and priority support.'),
  ('/faq', 'FAQ - Frequently Asked Questions | Pagelyzer', 'Find answers to common questions about Facebook Page audits, pricing, data privacy, and how Pagelyzer works.', 'pagelyzer FAQ, facebook audit questions, how does pagelyzer work, audit privacy', 'Get answers to the most frequently asked questions about Pagelyzer. Learn how our Facebook Page audit works, what data we access, how we protect your privacy, and how to get the most out of your audit reports.'),
  ('/contact', 'Contact Us - Pagelyzer Support', 'Get in touch with the Pagelyzer team for support, feedback, or partnership inquiries.', 'contact pagelyzer, support, help, feedback', 'Reach out to the Pagelyzer team for technical support, feature requests, partnership opportunities, or general feedback. We are here to help you succeed with your Facebook Page strategy.'),
  ('/sample-report', 'Sample Audit Report - Pagelyzer', 'See what a full Pagelyzer audit report looks like with real metrics, scores, and AI recommendations.', 'sample audit report, facebook audit example, pagelyzer demo', 'Preview a complete Pagelyzer audit report with real-world metrics and AI-generated recommendations. See exactly what you will receive when you run your first Facebook Page audit.'),
  ('/privacy-policy', 'Privacy Policy - Pagelyzer', 'Read our privacy policy to understand how Pagelyzer collects, uses, and protects your data.', 'privacy policy, data protection, GDPR, facebook data', ''),
  ('/terms-of-service', 'Terms of Service - Pagelyzer', 'Read the terms and conditions for using the Pagelyzer platform.', 'terms of service, terms and conditions, legal', ''),
  ('/data-deletion', 'Data Deletion - Pagelyzer', 'Learn how to request deletion of your data from Pagelyzer.', 'data deletion, delete account, remove data, GDPR', '');
```

### 2. Database: Create `blog_posts` table
```sql
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author TEXT DEFAULT 'Pagelyzer Team',
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published blogs" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Admins can manage blogs" ON public.blog_posts FOR ALL USING (public.is_admin_or_above(auth.uid()));
```

### 3. Create `SEOHead` component
New `src/components/seo/SEOHead.tsx` — fetches per-page SEO from `page_seo` table by current route, falls back to global settings from `useSEO`, and sets document.title + meta tags dynamically.

### 4. Create `SeeMoreText` component
New `src/components/ui/see-more-text.tsx` — truncates text to ~10-15 words, shows "See more" button to expand. Used on all marketing pages for SEO content blocks.

### 5. Apply `SEOHead` + `SeeMoreText` to every marketing page
Modify each page to:
- Call `SEOHead` (auto-fetches SEO for current route)
- Render `SeeMoreText` with the `seo_content` from the database at the bottom or appropriate section of each page

Pages to update: `HomePage`, `FeaturesPage`, `PricingPage`, `FAQPage`, `ContactPage`, `SampleReportPage`, `PrivacyPolicyPage`, `TermsOfServicePage`, `DataDeletionPage`

### 6. Create Blog system
- **`src/pages/BlogListPage.tsx`** — lists published blog posts with excerpts (full content NOT truncated here—shows excerpt + "Read more" link)
- **`src/pages/BlogPostPage.tsx`** — full blog post page with SEO head, structured data, full content visible
- **Add routes** in `App.tsx`: `/blog` and `/blog/:slug`
- **Add "Blog" to navigation** in `MarketingLayout.tsx`
- **Add blog to sitemap** edge function

### 7. Super Admin: Per-Page SEO editor
New **`src/pages/super-admin/settings/PageSEOSettings.tsx`**:
- Lists all routes from `page_seo` table
- Edit title, description, keywords, og_image, seo_content per page
- Add to settings layout routes

### 8. Super Admin: Blog manager
New **`src/pages/super-admin/BlogManagementPage.tsx`**:
- CRUD blog posts (title, slug, content, tags, cover image, SEO fields)
- Publish/unpublish toggle
- Add route in super admin section

### 9. Enhanced structured data
Update `SEOHead` to output proper JSON-LD per page type:
- HomePage → `WebApplication` + `Organization`
- Blog → `BlogPosting` with author, datePublished
- FAQ → `FAQPage` schema
- Pricing → `Product` with offers

### 10. Update sitemap edge function
Add blog post URLs and ensure all marketing pages are included dynamically from `page_seo` table.

## Files to create
- `src/components/seo/SEOHead.tsx`
- `src/components/ui/see-more-text.tsx`
- `src/pages/BlogListPage.tsx`
- `src/pages/BlogPostPage.tsx`
- `src/pages/super-admin/settings/PageSEOSettings.tsx`
- `src/pages/super-admin/BlogManagementPage.tsx`

## Files to modify
- `App.tsx` — add blog routes + page SEO settings route
- `MarketingLayout.tsx` — add Blog nav link
- All 9 marketing pages — add `SEOHead` + `SeeMoreText`
- `supabase/functions/sitemap/index.ts` — add blog posts
- `src/pages/super-admin/settings/SettingsLayout.tsx` — add Page SEO nav item
- 2 database migrations (page_seo + blog_posts tables)

