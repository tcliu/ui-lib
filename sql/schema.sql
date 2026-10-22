-- Source of truth for the database schema, applied with `npm run schema:apply`
-- to the dev SQLite file (PROFILE=dev) or to Neon (PROFILE=prod).
--
-- Keep it portable across both backends: quote nothing schema-specific, and
-- use only DDL SQLite and Postgres share. `toSqliteSql` in scripts/db-config.mjs
-- rewrites `$n` placeholders, `bigserial`, and `current_timestamp` for SQLite.
-- Timestamps are `timestamptz` stored in UTC: Postgres then casts
-- `current_timestamp` without the session timezone shifting it, while SQLite
-- keeps the explicit ISO-8601 UTC string the rewrite emits.
--
-- Replace `app_meta` with your domain tables, then list the tables `npm run
-- schema:apply` must find in SCHEMA_VERIFY_TABLES (default: app_meta).

create table if not exists app_meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default current_timestamp
);
