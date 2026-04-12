

# Match Post-Audit Preview to Sample Report Style

## Problem
After running an audit, users see a minimal `BasicReportPreview` (4 small score cards + 2 recommendations + "View Full Report" button). But the Sample Report page (`/sample-report`) shows a rich, detailed preview with score circle, key metrics grid, score breakdown bars, and full recommendations. This inconsistency is confusing.

## Solution
Replace the `BasicReportPreview` component with a rich inline report that mirrors the Sample Report's visual style — score ring, key metrics, breakdown bars, and recommendations — using real audit data.

## Changes

### 1. Rewrite `src/components/audit/BasicReportPreview.tsx`
Replace the current minimal card layout with the Sample Report's design:
- **Header**: Page name, audit date, with primary-colored banner (like sample report)
- **Score Ring**: SVG circle showing overall score with grade label (like `/sample-report`)
- **Key Metrics Grid**: 4 metric cards (followers, engagement rate, reach, posts) pulled from audit data
- **Score Breakdown Bars**: Progress bars for each category (engagement, consistency, readiness + growth if available)
- **Recommendations**: Grid of recommendation cards with priority icons
- **CTA**: "View Full Report" button at the bottom

### 2. Update `src/components/audit/AuditFlow.tsx`
- Fetch additional data after audit completes (metrics from `audit_metrics` table or from the run-audit response)
- Pass `inputData` and `detailedMetrics` to the new preview so it can show key metrics
- Update the `lastAuditResult` state to include `created_at`, `input_data`, and `score_breakdown` fields

### Files to modify
- `src/components/audit/BasicReportPreview.tsx` — full rewrite to match sample report style
- `src/components/audit/AuditFlow.tsx` — fetch more data, pass richer props

