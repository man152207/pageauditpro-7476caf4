

## Problem

Audit fail हुनुको कारण: code मा backend calls अझै `/api/*.php` paths मा pointing छन् (जस्तै `/api/run-audit.php`, `/api/check-subscription.php`)। यी PHP endpoints exist गर्दैनन् — actual backend Supabase Edge Functions हुन्। SPA fallback ले `index.html` return गर्छ, जसले `<!doctype` शुरु हुने HTML दिन्छ → JSON parse fail → "Unexpected token '<'" error।

यो पहिले `client.ts` fix गरेको issue (PHP backend conversion attempt) को बाँकी अंश हो।

## Affected Files (4)

1. `src/hooks/useAudits.ts` — `useAudit` (line 62), `useRunAudit` (line 172)
2. `src/contexts/AuthContext.tsx` — `fetchSubscription` (line 202)
3. `src/components/audit/AuditFlow.tsx` — `handleConnect` (line 116), `saveAndSelectPage` (line 168)
4. `src/pages/PublicReportPage.tsx` — public report fetch (line 33)

## Fix Strategy

सबै `fetch('/api/xxx.php', ...)` calls लाई Supabase client invoke मा convert गर्ने:

```ts
// Before
const response = await fetch(`/api/run-audit.php`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}`, ... },
  body: JSON.stringify({ connection_id, date_range }),
});
const data = await response.json();

// After
const { data, error } = await supabase.functions.invoke('run-audit', {
  body: { connection_id, date_range },
});
if (error) throw new Error(getEdgeFunctionHumanMessage(error, data, 'Failed to run audit'));
```

Mappings:
- `/api/run-audit.php` → `supabase.functions.invoke('run-audit')`
- `/api/check-subscription.php` → `supabase.functions.invoke('check-subscription')`
- `/api/get-audit-report.php?audit_id=X` → `invoke('get-audit-report', { body: { audit_id } })` (or query via `?` in path)
- `/api/facebook-oauth.php?action=get-auth-url` → `invoke('facebook-oauth', { body: { action: 'get-auth-url' } })`
- `/api/facebook-oauth.php?action=save-connection` → `invoke('facebook-oauth', { body: { action: 'save-connection', ... } })`
- `/api/get-public-report.php?slug=X` → `invoke('get-public-report', { body: { slug } })`

Auth token automatically attaches via Supabase client — manual `Authorization` header हटाउने। Error handling मा existing `getEdgeFunctionHumanMessage` helper प्रयोग गर्ने।

## Notes

- `AuthContext.tsx` को proactive token refresh logic (5-min expiry check) रहन्छ — Supabase client ले session manage गर्छ।
- Public report (`PublicReportPage`) मा session चाहिँदैन — anonymous invoke सहि छ।
- कुनै edge function signature change गर्नु पर्दैन; ती already deployed र working छन्।

