

# MySQL Schema + Data Export

## What I'll do

Generate a complete MySQL `.sql` file that includes:

1. **Schema** (CREATE TABLE statements) — same as before but refined
2. **INSERT statements** with ALL actual data from every table

## Data included

| Table | Rows |
|-------|------|
| profiles | 13 |
| plans | 4 |
| user_roles | 13 |
| audits | 78 |
| audit_metrics | 66 |
| fb_connections | 92 |
| blog_posts | 33 |
| subscriptions | 1 |
| payments | 1 |
| reports | 78 |
| free_audit_grants | 8 |
| settings | 13 |
| page_seo | 10 |
| audit_logs | 1 |

Tables with 0 rows (organizations, scheduled_posts, content_calendar, audit_schedules, security_events) will have CREATE TABLE only.

## Security note

The settings table contains **sensitive data** (API keys, secrets). These will be included as-is since you requested all data. The output file will contain real credentials — handle it carefully.

## Steps

1. Query all tables including JSONB columns (recommendations, score_breakdown, input_data, computed_metrics, raw_metrics, demographics, etc.)
2. Convert PostgreSQL types → MySQL types (same mapping as before)
3. Generate proper MySQL `INSERT INTO ... VALUES (...)` statements with escaped strings
4. Write complete file to `/mnt/documents/pagelyzer_mysql_with_data.sql`

## Output

Single `.sql` file with schema + all INSERT data, ready to import into any MySQL 8.0+ database.

