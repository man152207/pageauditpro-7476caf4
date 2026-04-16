

# PostgreSQL → MySQL Schema Conversion (.sql file)

## What this does
Export the entire Pagelyzer database schema (all 18+ tables, enums, functions, indexes) from PostgreSQL format and convert it to MySQL-compatible SQL — delivered as a downloadable `.sql` file.

## Conversion steps

1. **Extract full schema** — Query `information_schema` to get all tables, columns, data types, defaults, constraints, and indexes.

2. **Convert PostgreSQL → MySQL syntax**:
   - `uuid` → `CHAR(36)` with `UUID()` default
   - `text` → `TEXT` or `VARCHAR(255)` depending on usage
   - `jsonb` → `JSON`
   - `timestamp with time zone` → `DATETIME`
   - `boolean` → `TINYINT(1)`
   - `inet` → `VARCHAR(45)`
   - `numeric` → `DECIMAL(10,2)`
   - `text[]` (arrays) → separate junction table or `JSON`
   - PostgreSQL enums (`app_role`, `audit_type`, etc.) → MySQL `ENUM(...)`
   - `gen_random_uuid()` → commented note (MySQL 8 has `UUID()`)
   - `now()` → `CURRENT_TIMESTAMP`
   - RLS policies → added as SQL comments (MySQL has no RLS equivalent)

3. **Include**:
   - All CREATE TABLE statements
   - Primary keys and unique constraints
   - Index definitions
   - Enum type mappings
   - Foreign key relationships (as comments, since original uses no FK constraints)
   - RLS policies documented as comments
   - Database functions as comments (MySQL stored procedure equivalents noted)

4. **Output**: Write to `/mnt/documents/pagelyzer_mysql_schema.sql`

## Tables covered
`audit_logs`, `audit_metrics`, `audit_schedules`, `audits`, `blog_posts`, `content_calendar`, `fb_connections`, `free_audit_grants`, `organizations`, `page_seo`, `payments`, `plans`, `profiles`, `reports`, `scheduled_posts`, `security_events`, `settings`, `subscriptions`, `user_roles`

## Important note
- RLS (Row Level Security) has no MySQL equivalent — policies will be documented as comments
- PostgreSQL functions (`is_super_admin`, `has_role`, etc.) will be converted to MySQL stored function syntax where possible
- Array columns will be converted to JSON type

