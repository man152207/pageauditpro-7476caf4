

# Fix: Blog posts showing raw Markdown instead of rendered HTML

## Problem
Blog content is stored as Markdown (`## headings`, `**bold**`, `- lists`) but the renderer just does `post.content.replace(/\n/g, '<br/>')` — it never converts Markdown to HTML. Also, `@tailwindcss/typography` plugin is missing so even if HTML were rendered, `prose` classes wouldn't style it.

## Fix

### 1. Install dependencies
- `react-markdown` — renders Markdown as React components
- `@tailwindcss/typography` — provides `prose` styles for rendered content

### 2. Update `tailwind.config.ts`
Add `@tailwindcss/typography` to the plugins array.

### 3. Update `src/pages/BlogPostPage.tsx`
Replace the `dangerouslySetInnerHTML` line with `<ReactMarkdown>` component:
```tsx
import ReactMarkdown from 'react-markdown';

// Replace line 130:
<ReactMarkdown>{post.content}</ReactMarkdown>
```
This properly renders headings, bold, lists, links, code blocks etc.

### 4. Add prose styles to `src/index.css`
Add custom prose overrides matching the site's design system (heading colors, link colors, spacing) so blog content looks polished and consistent with the rest of the site.

### 5. Blog list page excerpt — no changes needed
Excerpts are plain text, not Markdown, so `BlogListPage.tsx` is fine as-is.

## Result
All 35 blog posts will render with proper headings, bold text, lists, and formatting instead of raw `##` and `**` symbols.

