#!/usr/bin/env node

// Fail `npm publish` before the long publish:check gate when the target registry
// has no usable credentials. npm contacts the registry only at the final PUT, so
// without this a missing or expired token surfaces after check, build, tests and
// the scratch-consumer run, and the failure (E401/E404) reads like a package
// error rather than an account problem.
//
// A dry run uploads nothing, so the probe is skipped there. A publish-only
// granular token that cannot answer `whoami` can skip it with
// SKIP_PUBLISH_AUTH_CHECK=1 (the publish itself still needs the write scope).

import { execFileSync } from 'node:child_process'

const shell = process.platform === 'win32'

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell })
}

// An explicit `--registry` reaches lifecycle scripts as npm_config_registry;
// otherwise read the resolved config so a project or user `.npmrc` is honored.
const registry =
  process.env.npm_config_registry?.trim() || run('npm', ['config', 'get', 'registry']).trim()

if (process.env.npm_config_dry_run === 'true' || process.env.SKIP_PUBLISH_AUTH_CHECK === '1') {
  console.log(`publish-auth: skipped for ${registry} (dry run or explicit skip)`)
  process.exit(0)
}

try {
  const user = run('npm', ['whoami', '--registry', registry]).trim()
  console.log(`publish-auth: ${user} at ${registry}`)
} catch {
  console.error(`publish-auth: no usable credentials for ${registry}.`)
  console.error('Log in first (npm login) or set an auth token for that registry, then retry.')
  process.exit(1)
}
