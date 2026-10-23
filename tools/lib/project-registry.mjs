import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { ROOT } from '../../scripts/lib/root.mjs'

// Config root: the `~/.agents` checkout that carries the project registry and
// the parser dependency.
const CONFIG_ROOT = process.env.AI_CONFIG_DIR ?? join(process.env.HOME ?? '', '.agents')
const REGISTRY = join(CONFIG_ROOT, '.metadata', 'projects.yml')

/** Report a fatal gate error and stop. */
export function fail(message) {
  console.error(`shared-parity: ${message}`)
  process.exit(2)
}

// The registry is YAML: parse it with the `yaml` package resolved from the
// config root (falling back to this project's install), and fail fast with the
// file and location on malformed content. Only an absent registry means "no
// data" and yields no siblings.
function readRegistry() {
  if (!existsSync(REGISTRY)) return null
  let parseYaml
  let resolveError
  for (const base of [CONFIG_ROOT, ROOT]) {
    try {
      parseYaml = createRequire(join(base, 'package.json'))('yaml').parse
      break
    } catch (error) {
      resolveError = error
    }
  }
  if (!parseYaml) {
    fail(
      `the \`yaml\` package is required to read ${REGISTRY}; install it beside the config root ` +
        `(cd ${CONFIG_ROOT} && npm install yaml)` +
        (resolveError ? ` (last error: ${resolveError.message})` : ''),
    )
  }
  let document
  try {
    document = parseYaml(readFileSync(REGISTRY, 'utf8'))
  } catch (error) {
    fail(`failed to parse ${REGISTRY}: ${error.message}`)
  }
  const entries = document?.projects
  if (!Array.isArray(entries)) fail(`${REGISTRY} must carry a top-level \`projects\` list`)
  return entries.map((entry, index) => {
    const name = entry?.name
    const path = entry?.path
    if (typeof name !== 'string' || !name || typeof path !== 'string' || !path) {
      fail(`${REGISTRY}:projects[${index}] must carry string \`name\` and \`path\``)
    }
    return { name, path }
  })
}

/** The registered consumers, minus this canonical checkout and non-apps. */
export function projectPaths() {
  const entries = readRegistry()
  if (entries === null) return []
  return entries.filter(
    entry => resolve(entry.path) !== resolve(ROOT) && existsSync(join(entry.path, 'src', 'lib')),
  )
}
