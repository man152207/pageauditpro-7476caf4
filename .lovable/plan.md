

# Add preview-mode tooltip to Facebook post links

## What
Add a small info tooltip next to every "View on Facebook" link explaining that links may appear blocked in the Lovable preview but work fine on the published site.

## Files to modify

### 1. `src/components/report/TopPostsTable.tsx` (~line 209-220)
Next to the "View" link, add a Tooltip with an Info icon:
```
View ⓘ  ← tooltip: "Facebook links may be blocked in preview mode. They work normally on the live site."
```

### 2. `src/components/report/PostsTabView.tsx` (~line 144-158)
Same tooltip added next to the external link in PostRow.

### 3. `src/components/report/CreativePreview.tsx` (~line 115-123)
Same tooltip added next to the creative permalink.

Each tooltip will use the existing `<Tooltip>` / `<TooltipContent>` components already imported in these files, with a small `Info` icon (already imported in most of them).

