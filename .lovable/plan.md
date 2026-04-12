

# SEO Content + Blog Posts Generation with Global Keywords

## Overview
Generate comprehensive SEO content for all 10 existing marketing pages AND create 30-40 SEO-optimized blog posts — all with deeply researched, globally competitive keywords targeting the Facebook audit/social media marketing niche.

## Approach

Use the Lovable AI script to research and generate all content in bulk, then insert into the database.

### Step 1: Generate updated SEO for 10 existing pages
Use AI to produce for each route:
- **Title** (60 chars, keyword-front-loaded)
- **Description** (155 chars, compelling + keywords)
- **Keywords** (20-30 high-volume global keywords per page)
- **seo_content** (300-500 word keyword-rich paragraph)

Routes: `/`, `/features`, `/pricing`, `/faq`, `/contact`, `/sample-report`, `/privacy-policy`, `/terms-of-service`, `/data-deletion`, `/blog`

### Step 2: Generate 35 blog posts
AI-generated articles covering high-search-volume topics like:
- "How to audit your Facebook Page in 2026"
- "Facebook engagement rate benchmarks by industry"
- "Best times to post on Facebook"
- "Facebook algorithm changes explained"
- "Social media audit checklist"
- "How to increase Facebook Page followers organically"
- "Facebook vs Instagram marketing comparison"
- "AI tools for social media management"
- etc.

Each blog post will include:
- `slug`, `title`, `excerpt`, `content` (1000-2000 words, markdown)
- `meta_title`, `meta_description`, `meta_keywords`
- `tags`, `author`, `published = true`, `published_at = now()`

### Step 3: Insert into database
- UPDATE `page_seo` table for 10 existing routes
- INSERT 35 new rows into `blog_posts` table

### Keyword Research Focus Areas
Global high-volume keywords across these clusters:
1. **Facebook audit**: facebook page audit, facebook page analyzer, facebook page health check, social media audit tool
2. **Engagement**: facebook engagement rate, how to increase facebook engagement, engagement calculator
3. **Analytics**: facebook analytics tool, facebook insights alternative, social media analytics
4. **Content strategy**: best time to post on facebook, facebook content strategy, social media content calendar
5. **Growth**: grow facebook page, increase facebook followers, facebook marketing tips
6. **Comparison**: facebook vs instagram, social media management tools comparison
7. **AI/Automation**: AI social media tools, automated social media audit, AI marketing recommendations
8. **Industry-specific**: facebook for small business, facebook for agencies, nonprofit facebook marketing

## Technical Details
- Use `lovable_ai.py` script with `google/gemini-3-flash-preview` for content generation
- Generate in batches to avoid rate limits
- Output as JSON, then insert via database tools
- All blog posts marked `published: true` with current timestamp

## Files involved
- No code file changes needed
- Database inserts only: `page_seo` (UPDATE 10 rows) + `blog_posts` (INSERT ~35 rows)

