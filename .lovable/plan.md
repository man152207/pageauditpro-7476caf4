

# Fix: Edge Function CORS + Calendar Badge Warning

## Root Cause
The `schedule-post` edge function's CORS `Access-Control-Allow-Headers` only allows `authorization, x-client-info, apikey, content-type`, but the Supabase JS client v2.93+ sends additional headers like `x-supabase-client-platform`. The browser's preflight (OPTIONS) request gets rejected, causing "Failed to fetch".

The same issue exists in `publish-scheduled-posts`.

## Fix

### 1. Update CORS headers in both edge functions

**`supabase/functions/schedule-post/index.ts`** and **`supabase/functions/publish-scheduled-posts/index.ts`**:

Replace:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

With:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

### 2. Fix CalendarGrid Badge ref warning

**`src/components/planner/CalendarGrid.tsx`**: The `PopoverTrigger asChild` passes a ref to `Badge`, which doesn't support `forwardRef`. Change the trigger from `Badge` to a native `<button>` element (already done correctly — the trigger is a `<button>`). The warning is actually from the `Badge` inside `PopoverContent`, not the trigger. No fix needed for functionality, but we can suppress it.

### 3. Deploy edge functions

Deploy both updated functions to resolve the CORS issue.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/schedule-post/index.ts` | Update CORS headers |
| `supabase/functions/publish-scheduled-posts/index.ts` | Update CORS headers |

