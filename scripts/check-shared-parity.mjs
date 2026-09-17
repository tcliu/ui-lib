import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Drift gate for the shared UI surface. `ui-lib` is the canonical source; every
// sibling app must carry byte-identical copies of the files listed below, apart
// from the documented per-project exceptions. Run from the `ui-lib` root:
//   node scripts/check-shared-parity.mjs
// Exits non-zero and names each diverged file so a port that was not synced
// back is caught in `check` rather than discovered later.

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SELF = 'ui-lib'
const REGISTRY = join(process.env.HOME ?? '', '.agents', '.metadata', 'projects.yml')

// Shared files compared byte-for-byte across every app.
const SHARED = {
  'src/lib/components': [
    'BaseDialog.svelte',
    'Button.svelte',
    'Buttons.svelte',
    'Checkbox.svelte',
    'Chip.svelte',
    'FormField.svelte',
    'Menu.svelte',
    'NumberInput.svelte',
    'Pagination.svelte',
    'PasswordInput.svelte',
    'SearchInput.svelte',
    'SelectDropdown.svelte',
    'Spinner.svelte',
    'Splitter.svelte',
    'Tabs.svelte',
    'Tooltip.svelte',
  ],
  'src/lib/icons': [
    'CheckIcon.svelte',
    'ChevronDownIcon.svelte',
    'ChevronDownSmallIcon.svelte',
    'ChevronLeftIcon.svelte',
    'ChevronRightIcon.svelte',
    'ChevronUpSmallIcon.svelte',
    'CloseIcon.svelte',
    'EyeIcon.svelte',
    'EyeSlashIcon.svelte',
    'GlobeIcon.svelte',
    'PaletteIcon.svelte',
    'SearchIcon.svelte',
  ],
  'src/lib/actions': [
    'click-outside.ts',
    'drag-close-down.ts',
    'use-dropdown.svelte.ts',
    'use-focusout-close.ts',
    'use-list-selection.svelte.ts',
  ],
  'src/lib': ['dropdown-chrome.ts', 'position-panel.svelte.ts', 'text-size.ts'],
  scripts: [
    'copy-worktree-config.mjs',
    'create-worktree.mjs',
    'delete-worktrees.mjs',
    'find-running-apps.mjs',
    'register-worktrees.mjs',
    'run-e2e.mjs',
    'worktree-manager.mjs',
    '_tui.mjs',
    '_worktrees.mjs',
  ],
}

// Per-project exceptions with the reason each may legitimately differ.
const EXCEPTIONS = [
  [
    'src/lib/components/ConfirmDialog.svelte',
    'three variants trade closeLabel against dismissKeydownCapture and rely on different BaseDialog dismiss defaults',
  ],
  [
    'src/lib/components/TagInput.svelte',
    'share-text models tags as Tag[] objects with colors while the others use string[] and per-tag classes; data models are incompatible',
  ],
  ['src/lib/column-width-storage.ts', 'per-app storage-key prefix'],
  ['src/lib/i18n.svelte.ts', 'per-app locale dictionaries'],
  ['scripts/apply-schema.mjs', 'per-project schema fork'],
  ['scripts/db-config.mjs', 'per-project database configuration fork'],
  ['scripts/deploy.mjs', 'per-project deploy fork'],
]
const isExcepted = rel => EXCEPTIONS.some(([p]) => p === rel)

function projectPaths() {
  if (!existsSync(REGISTRY)) return []
  const body = readFileSync(REGISTRY, 'utf8')
  const entries = []
  const re = /- name:\s*(\S+)\s*\n\s*path:\s*(\S+)/g
  let m
  while ((m = re.exec(body))) entries.push({ name: m[1], path: m[2] })
  return entries.filter(e => e.name !== SELF && !isExceptedName(e.name))
}

// Non-SvelteKit siblings carry no shared UI surface.
const isExceptedName = name => name === 'ai'

const hash = p => createHash('md5').update(readFileSync(p)).digest('hex')

const apps = projectPaths()
if (apps.length === 0) {
  console.log('shared-parity: no registered sibling projects found; nothing to compare')
  process.exit(0)
}
if (!existsSync(join(ROOT, 'src', 'lib'))) {
  console.error('shared-parity: run this from the ui-lib project root')
  process.exit(2)
}

const diverged = []
const missing = []
let compared = 0

for (const [dir, files] of Object.entries(SHARED)) {
  for (const f of files) {
    const rel = `${dir}/${f}`
    if (isExcepted(rel)) continue
    const canonical = join(ROOT, rel)
    if (!existsSync(canonical)) {
      console.error(`shared-parity: canonical file missing: ${rel}`)
      process.exit(2)
    }
    const want = hash(canonical)
    for (const app of apps) {
      const target = join(app.path, rel)
      if (!existsSync(target)) {
        missing.push(`${app.name}: ${rel}`)
        continue
      }
      compared += 1
      if (hash(target) !== want) diverged.push(`${app.name}: ${rel}`)
    }
  }
}

if (missing.length > 0) {
  console.log(`shared-parity: ${missing.length} file(s) not present in a sibling (port candidates):`)
  for (const m of missing) console.log(`  absent   ${m}`)
}
if (diverged.length > 0) {
  console.log(`shared-parity: ${diverged.length} file(s) diverged from the canonical copy:`)
  for (const d of diverged) console.log(`  diverged ${d}`)
  console.log(`\nPort the canonical version with the unify skill, or add a documented exception.`)
  process.exit(1)
}

console.log(
  `shared-parity: ${compared} comparison(s) across ${apps.length} project(s), no unexpected divergence`,
)
