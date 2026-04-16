

# Fix MySQL Import for Shared Hosting (phpMyAdmin / MariaDB)

## Problem

The current `.sql` file fails because:

1. **`CREATE DATABASE` not allowed** — shared hosting (cPanel) doesn't let you create databases via SQL. Your database `adsmpgco_Pagelyzer` already exists and was created via cPanel. The SQL tries to create `pagelyzer` which your user has no permission for.
2. **`USE pagelyzer`** — wrong database name; yours is `adsmpgco_Pagelyzer`.
3. **`DEFAULT (UUID())`** — MySQL 8.0+ syntax, but your host runs **MariaDB** (phpMyAdmin shows MariaDB), which doesn't support expression defaults like `(UUID())`.
4. **Stored functions / DELIMITER** — phpMyAdmin often chokes on `DELIMITER //` blocks.
5. **Timestamp format** — values like `'2026-02-01 16:04:19.558621+00'` have timezone offsets (`+00`) that MariaDB rejects.

## What I'll generate

### File 1: `pagelyzer_mariadb_schema.sql`
- No `CREATE DATABASE` / `USE` statements
- All `DEFAULT (UUID())` replaced with `DEFAULT NULL` + comment to generate UUIDs in app
- No `DELIMITER` / stored functions / triggers (documented as comments)
- Clean MariaDB 10.x compatible syntax

### File 2: `pagelyzer_mariadb_data.sql`
- Only `INSERT INTO` statements
- All timestamps stripped of `+00` timezone suffix
- Properly escaped strings for MariaDB
- Ready to import after schema file

### File 3: `pagelyzer_mariadb_full.sql`
- Combined single file (schema + data) for one-step import

## Import instructions (included as comments in the files)

```text
1. Go to cPanel → phpMyAdmin
2. Select database: adsmpgco_Pagelyzer
3. Click "Import" tab
4. Upload pagelyzer_mariadb_schema.sql first
5. Then upload pagelyzer_mariadb_data.sql
   (or just upload pagelyzer_mariadb_full.sql for everything at once)
```

## Key changes from previous file

| Issue | Old | New |
|-------|-----|-----|
| DB creation | `CREATE DATABASE pagelyzer` | Removed |
| UUID default | `DEFAULT (UUID())` | `DEFAULT NULL` |
| Timestamps | `+00` suffix | Stripped |
| Functions | `DELIMITER //` blocks | Comments only |
| Engine | MySQL 8.0+ | MariaDB 10.x safe |

