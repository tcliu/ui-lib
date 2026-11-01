// What the published tarball carries from `src/lib`. `svelte-package` compiles
// every source file, then `tools/build-package.mjs` prunes the server-only
// directory and each spec or fixture. The rules live here so the package build
// and the parity gate agree: the gate treats a consumer's package import as
// shippable only when its source survives the same prune, instead of accepting a
// path the tarball drops.
import { basename } from 'node:path'

/** The server-only directory, pruned from the top of the compiled output. */
export const PRUNED_DIR = 'server'

/** A spec or fixture that never ships, whatever directory holds it. */
export const PRUNED_NAME_RE = /\.(test|harness)\./

/** Whether a path relative to `src/lib` reaches a consumer through the tarball. */
export function shipsFromLib(rel) {
  if (rel === PRUNED_DIR || rel.startsWith(`${PRUNED_DIR}/`)) return false
  return !PRUNED_NAME_RE.test(basename(rel))
}
