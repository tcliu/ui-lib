import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { filterWarnings, prune } from './build-package.mjs'

const WARNINGS_HEADER = '@sveltejs/package found the following issues while packaging your library:'

function guard(paths) {
  return [
    'The following server-only files do not import `$app/server` or `$app/env/private`:',
    ...paths.map(path => `- ${path}`),
    "These files will not be blocked from being imported on the client. If you intend to use this package within a SvelteKit application and want to prevent this, add `import '$app/server'` which will throw when imported on the client.",
    'These files were deemed server-only because they either contain `.server.` in their filename or are located in a `server` directory, which have special meaning within SvelteKit apps.',
  ].join('\n')
}

const compiled = 'src/lib -> dist\n'

describe('filterWarnings', () => {
  it('drops the guard warning once its files are pruned', () => {
    const output = `${compiled}${WARNINGS_HEADER}\n${guard(['server/card.ts', 'i18n.server.test.ts'])}\n`
    const result = filterWarnings(output, ['index.js', 'components/Button.svelte'])

    expect(result.text).toBe(compiled)
    expect(result.pruned).toEqual(['server/card.ts', 'i18n.server.test.ts'])
    expect(result.leaked).toEqual([])
    expect(result.kept).toEqual([])
  })

  it('keeps the guard warning when a listed file still has an artifact', () => {
    const output = `${compiled}${WARNINGS_HEADER}\n${guard(['server/card.ts', 'i18n.server.test.ts'])}\n`
    const result = filterWarnings(output, ['i18n.server.js', 'server/card.js'])

    // `i18n.server.test.ts` was pruned, `server/card.ts` was not: the warning
    // stays whole and the surviving artifact is named.
    expect(result.text).toContain('The following server-only files')
    expect(result.text).toContain('- server/card.ts')
    expect(result.pruned).toEqual([])
    expect(result.leaked).toEqual(['server/card.js'])
  })

  it('keeps unrelated warnings beside a dropped guard warning', () => {
    const other = 'Avoid usage of `import.meta.env` in your code.'
    const output = `${compiled}${WARNINGS_HEADER}\n${guard(['server/card.ts'])}\n\n${other}\n`
    const result = filterWarnings(output, [])

    expect(result.text).toBe(`${compiled}${WARNINGS_HEADER}\n${other}\n`)
    expect(result.pruned).toEqual(['server/card.ts'])
    // A warning the guard filter cannot prove moot survives, so the build fails.
    expect(result.kept).toEqual([other])
  })

  it('passes output through when packaging reported no issues', () => {
    const output = `${compiled}`
    expect(filterWarnings(output, [])).toEqual({ text: output, pruned: [], leaked: [], kept: [] })
  })
})

describe('prune', () => {
  it('drops the server directory and every test or harness artifact', () => {
    const out = mkdtempSync(join(tmpdir(), 'build-package-prune-'))
    for (const file of [
      'index.js',
      'components/Button.svelte',
      'server/card.js',
      'server/card.d.ts',
      'i18n.server.test.js',
      'nested/deep/fixture.harness.svelte',
      'latest.testing.js',
    ]) {
      mkdirSync(dirname(join(out, file)), { recursive: true })
      writeFileSync(join(out, file), '')
    }

    prune(out)

    const remaining = ['index.js', 'components/Button.svelte', 'latest.testing.js']
    for (const file of remaining) expect(existsSync(join(out, file))).toBe(true)
    for (const file of ['server/card.js', 'i18n.server.test.js', 'nested/deep/fixture.harness.svelte']) {
      expect(existsSync(join(out, file))).toBe(false)
    }
  })
})
