

# Blog System Overhaul

## Problems Identified
1. **Raw markdown symbols showing** — Blog list page shows `post.excerpt` as plain text but some excerpts may contain markdown. The blog post page uses `react-markdown` but prose styling may not be rendering `##`, `---`, `***` properly due to CSS issues.
2. **No cover images** — All 33 posts have `cover_image = NULL`. Admin panel only has a URL input field, no file upload.
3. **Content too short** — Most posts are 2000-5000 characters (roughly 300-800 words). Need 1000+ words each.
4. **Content structure** — Posts use too many bullet points and not enough paragraphs.

## Plan

### 1. Fix Markdown Rendering and Fonts
- Ensure the `prose` classes on `BlogPostPage.tsx` render headings, paragraphs, lists, and dividers correctly
- Add proper prose typography overrides in `index.css` for blog content (font sizes, line heights, spacing)
- On the blog list page, strip markdown from excerpts so no raw `##`, `*`, `---` symbols show

### 2. Add Image Upload to Admin Panel
- Create a `blog-images` storage bucket (public)
- Add RLS policies so admins can upload
- Replace the "Cover Image URL" text input with a file upload component that uploads to the bucket and stores the public URL
- Show image preview in the editor

### 3. Generate Thumbnails for All 33 Existing Posts
- Use Lovable AI image generation (Gemini flash-image) to create unique thumbnail images for each blog post based on its title
- Upload each generated image to the `blog-images` bucket
- Update each post's `cover_image` field with the public URL

### 4. Rewrite All 33 Blog Posts Content
- Rewrite each post to be 1000+ words (approximately 6000+ characters)
- Use paragraph-heavy structure instead of bullet lists
- Proper markdown: clean headings, no raw symbols, natural flowing paragraphs
- Keep the same slugs, titles, and SEO metadata

### Technical Details
- Storage bucket creation via SQL migration
- Image generation via edge function or script using Lovable AI Gateway
- Content updates via database insert tool (UPDATE statements)
- Blog list excerpt: use a helper to strip markdown before displaying
- Admin panel: add file input with `supabase.storage.from('blog-images').upload()`

### Scope
This is a large task (33 posts to rewrite + 33 thumbnails to generate + UI changes). The implementation will be done in batches.

