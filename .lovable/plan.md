

# Content Planner Upgrade Plan

## Summary
Three improvements to the Content Planner: searchable user selector, auto-publish toggle, and better calendar hover/popover.

---

## Changes

### 1. Searchable User Selector
**File: `src/pages/dashboard/ContentPlannerPage.tsx`**
- Replace the current `<Select>` dropdown with a `Command`-based searchable combobox (using existing `command.tsx` + `popover.tsx` components)
- Users can type to filter by name or email
- Shows matching results in a scrollable list

### 2. Auto-Publish Toggle
**File: `src/pages/dashboard/ContentPlannerPage.tsx`**
- Add a `Switch` toggle next to the user selector: **"Auto-publish posts"**
- Default: ON (current behavior — posts with status "scheduled" get auto-published by the cron)
- When OFF: posts are saved as "draft" only (content planning mode — no auto-publish)
- This toggle controls the PostComposer behavior:
  - When OFF: hide the "Schedule" button, only show "Save Plan" (saves as draft)
  - When ON: show both "Save Draft" and "Schedule" as today

**File: `src/components/planner/PostComposer.tsx`**
- Accept new prop `autoPublish: boolean`
- When `autoPublish` is false:
  - Hide the "Schedule" button
  - Change "Save Draft" to "Save Plan"
  - Still allow setting a date (for planning purposes) but status stays "draft"

### 3. Improved Calendar Hover/Popover
**File: `src/components/planner/CalendarGrid.tsx`**
- Increase popover width from `w-72` to `w-80`
- Improve content display:
  - Use `max-h-[200px] overflow-y-auto` for long content
  - Better typography: slightly larger text, proper line-height
  - Add a subtle header separator
  - Show post date/time more prominently
  - Increase truncation on calendar cell from 30 chars to show 2 lines with `line-clamp-2` instead of `truncate`
- Calendar cell post items: change from single-line truncate to 2-line clamp for better readability

---

## Technical Details

- **No database changes needed** — the auto-publish toggle is purely UI logic. Posts saved as "draft" are already ignored by the `publish-scheduled-posts` cron function (it only processes status="scheduled").
- **No edge function changes** — the existing `schedule-post` edge function already supports both "draft" and "scheduled" statuses.
- The searchable user selector uses the existing `Command` component from shadcn/ui (already in the project at `src/components/ui/command.tsx`).
- The `Switch` component already exists at `src/components/ui/switch.tsx`.

---

## Files Modified
1. `src/pages/dashboard/ContentPlannerPage.tsx` — searchable user picker + auto-publish toggle
2. `src/components/planner/PostComposer.tsx` — accept `autoPublish` prop, adjust buttons
3. `src/components/planner/CalendarGrid.tsx` — improved popover and cell content display

