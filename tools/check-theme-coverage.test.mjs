import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { collectViolations } from './check-theme-coverage.mjs'

// vitest runs from the project root.
const ROOT = process.cwd()

const LIGHT_FAMILY = `[data-theme='light'], [data-theme='sky'] {
  --color-cyan-200: #155e75;
}
[data-theme='light'] {
  --color-slate-400: #475569;
}`

function fixture(styles, source) {
  const root = mkdtempSync(join(tmpdir(), 'theme-coverage-'))
  mkdirSync(join(root, 'src', 'lib'), { recursive: true })
  writeFileSync(join(root, 'src', 'lib', 'styles.css'), styles)
  writeFileSync(join(root, 'src', 'probe.svelte'), source)
  return root
}

describe('theme coverage gate', () => {
  it('passes on the shipped palette', () => {
    expect(collectViolations(ROOT)).toEqual([])
  })

  it('reports a low-grade ink the light family does not remap', () => {
    const root = fixture(LIGHT_FAMILY, '<span class="text-sky-200 text-violet-400"></span>')
    expect(collectViolations(root)).toEqual(['sky-200', 'violet-400'])
  })

  it('ignores vivid fills and remapped grades', () => {
    const root = fixture(LIGHT_FAMILY, '<span class="bg-sky-500/10 text-cyan-200 text-slate-400"></span>')
    expect(collectViolations(root)).toEqual([])
  })
})
