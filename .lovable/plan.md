
# Fix why active Facebook pages still show 0 / missing metrics

## What I confirmed from the live app
For the latest real reports I checked (`MPG Solution` and `Nayaniti`), the backend is not returning “fake positive” data anymore, but it is still failing in two critical places and then collapsing the report to zero:

1. `insights: true` is coming back with real trend data
   - `page_follows`
   - `page_media_view`
   - `page_post_engagements`

2. But `pageInfo: false` and `posts: false`
   - followers become `null`
   - posts analyzed become `0`
   - readiness becomes `0`
   - engagement/consistency become `null`
   - overall score becomes `0`

3. The live stored error for posts is:
```text
(#12) deprecate_post_aggregated_fields_for_attachement is deprecated for versions v3.3 and higher
```
So the current posts query itself is broken.

4. One saved report also shows the page info request failing with a permission/field error:
```text
(#10) This endpoint requires the 'pages_read_engagement' permission or the 'Page Public Content Access' feature
```

## Root cause
This is now a partial-data handling bug, not just a token bug:

- the audit still fetches trend insights successfully
- the post fetch is using a brittle/deprecated Graph API field mix
- the page info fetch is too fragile and can fail entirely
- the scoring pipeline depends mainly on `pageInfo + posts`, so when those 2 fail, the whole report falls to zero even though real insights exist

That is why an active page can still look dead inside the report.

## Implementation plan

### 1. Rebuild the Facebook fetch layer in `run-audit`
- replace the broken `/{page_id}/posts` field set with a safe supported fetch strategy
- fetch posts in 2 stages:
  - base post list with safe fields only
  - per-post engagement fields using supported follow-up requests
- keep full pagination for the entire selected date range
- split page info into smaller safe requests instead of one oversized all-fields request
- store exact fetch errors:
  - `pageInfoError`
  - `postsError`
  - `postsFetchMode`
  - `followersSource`

### 2. Use real insight fallback when post/page-info fetch fails
If Facebook gives real insights but not full post/page info:
- use the latest `page_follows` point as current followers fallback
- use `page_post_engagements` totals for range engagement fallback
- keep post-level sections unavailable unless real posts are fetched
- never show `0` just because a fetch failed
- never invent numbers

### 3. Make scoring honest with partial data
- engagement score:
  - use post-level calculations when posts are available
  - otherwise use insight-derived engagement if that is the only real source available
- consistency score:
  - only calculate when real post count/timestamps exist
  - otherwise mark unavailable
- readiness score:
  - only calculate when page info is actually fetched
  - otherwise mark unavailable, not `0`
- overall score:
  - calculate only from categories backed by real data
  - exclude unavailable categories instead of dragging total to zero

### 4. Return transparent report metadata from `get-audit-report`
Add/report:
- metric source labels (`page_info`, `insights_fallback`, `posts`)
- exact failure reasons for page info / posts
- which score categories were excluded
- whether followers came from page info or insights fallback

### 5. Fix the report UI so it explains reality clearly
Update:
- `AuditReportPage.tsx`
- `HeroScoreSection.tsx`
- `ScoreExplanations.tsx`
- `BasicReportPreview.tsx`

Behavior:
- show real followers if available from insights fallback
- show range engagement totals from insights when post fetch fails
- show `Unavailable` for post-level metrics that were not retrievable
- replace the generic warning with exact reasons:
  - broken post fetch
  - permission restriction
  - no posts in selected range
- stop showing a misleading overall `0` when only some categories failed

### 6. Verification on your real pages
After implementation, re-run on:
- MPG Solution
- Nayaniti

Verify:
- followers are populated from a real source
- selected duration is respected
- posts are counted if Facebook allows retrieval
- if posts still cannot be fetched, the report clearly says why and still shows real insight-based metrics
- overall score is based only on retrievable real inputs

## Files to update
- `supabase/functions/run-audit/index.ts`
- `supabase/functions/get-audit-report/index.ts`
- `src/pages/dashboard/AuditReportPage.tsx`
- `src/components/report/HeroScoreSection.tsx`
- `src/components/report/ScoreExplanations.tsx`
- `src/components/audit/BasicReportPreview.tsx`

## Expected result
After this fix, active pages will no longer look dead just because one Graph API request failed:
- real followers should show
- real range engagement should show
- post metrics should show when retrievable
- unavailable data should be labeled honestly
- overall score should stop collapsing to fake-looking zero
