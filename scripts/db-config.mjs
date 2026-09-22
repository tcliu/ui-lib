#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from '@neondatabase/serverless'
import { parseEnvFile } from './env-file.mjs'

export { parseEnvFile }

export function loadScriptEnv(env = process.env) {
  return {
    ...parseEnvFile('.env'),
    ...parseEnvFile('.env.local'),
    ...parseEnvFile('.env.vercel'),
    ...env,
  }
}

export function getDatabaseURL(env = process.env) {
  const loadedEnv = loadScriptEnv(env)
  return (loadedEnv.DATABASE_URL || '').trim()
}

export function resolveScriptProfile(env = process.env) {
  const explicit = (env.PROFILE || '').trim().toLowerCase()
  if (explicit === 'dev' || explicit === 'prod') return explicit

  const mergedProfile = (loadScriptEnv(env).PROFILE || '').trim().toLowerCase()
  if (mergedProfile === 'dev' || mergedProfile === 'prod') return mergedProfile

  return 'dev'
}

export function getSqlitePath(env = process.env) {
  const loadedEnv = loadScriptEnv(env)
  return (loadedEnv.SQLITE_PATH || '.data/ui-lib-dev.sqlite').trim()
}
export function getSchemaName(env = process.env) {
  const loadedEnv = loadScriptEnv(env)
  return (loadedEnv.SCHEMA_NAME || '').trim()
}
export function getVerifyTables(env = process.env) {
  const raw = (loadScriptEnv(env).SCHEMA_VERIFY_TABLES || 'app_meta').trim()
  const tables = raw
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
  return tables.length > 0 ? tables : ['app_meta']
}

// Absolute path of the schema source both apply flows read
// (apply-schema.mjs for Neon/SQLite, apply-d1-schema.mjs for D1).
// `root` is injectable so tests can point at a fixture dir; production
// callers omit it (repo root).
export function neonSchemaPath(root = join(dirname(fileURLToPath(import.meta.url)), '..')) {
  return join(root, 'sql', 'schema.sql')
}

// Whether there is a schema file to apply: without one the deploy
// interview skips the apply-schema question instead of asking it.
export function hasNeonSchema(root) {
  try {
    return existsSync(neonSchemaPath(root))
  } catch {
    return false
  }
}

// Host/database identifiers for log lines. Never returns credentials —
// only the hostname and path the operator needs to find the database.
export function describeDatabaseTarget(databaseURL) {
  try {
    const url = new URL(databaseURL)
    return {
      host: url.hostname || 'unknown',
      database: url.pathname.replace(/^\//, '') || 'unknown',
    }
  } catch {
    return { host: 'unknown', database: 'unknown' }
  }
}

// Identifiers cannot be parameterized, so whitelist them before interpolating.
export function quoteIdentifier(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`)
  }
  return `"${name}"`
}

export function toSqliteSql(sql) {
  return sql
    .replace(/\$\d+/g, () => '?')
    .replaceAll('bigserial', 'integer')
    .replaceAll('current_timestamp', "(strftime('%Y-%m-%dT%H:%M:%fZ','now'))")
}

export function createDbPool(env = process.env) {
  const databaseURL = getDatabaseURL(env)

  if (!databaseURL) {
    throw new Error('Missing DATABASE_URL for database access')
  }

  return new Pool({
    connectionString: databaseURL,
    max: 10,
  })
}
