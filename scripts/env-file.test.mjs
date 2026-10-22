import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { readJsonFile, parseEnvFile } from './env-file.mjs'

function scratchFile(name, contents) {
  const dir = mkdtempSync(join(tmpdir(), 'env-file-'))
  const path = join(dir, name)
  writeFileSync(path, contents)
  return path
}

describe('readJsonFile', () => {
  it('parses a present JSON file', () => {
    expect(readJsonFile(scratchFile('package.json', '{"name":"x"}'))).toEqual({ name: 'x' })
  })

  it('returns the fallback when the file is absent', () => {
    expect(readJsonFile(join(tmpdir(), 'definitely-absent.json'), {})).toEqual({})
    expect(readJsonFile(join(tmpdir(), 'definitely-absent.json'))).toBeNull()
  })

  it('stops the run on a present but malformed file, naming the path', () => {
    const path = scratchFile('broken.json', '{"name":')
    expect(() => readJsonFile(path)).toThrow(/Invalid JSON in /)
    expect(() => readJsonFile(path)).toThrow(path)
  })
})

describe('parseEnvFile', () => {
  it('reads plain, quoted, and commented entries', () => {
    const path = scratchFile(
      '.env',
      ['# comment', '', 'PLAIN=value', 'DQUOTED="two words"', "SQUOTED='single'", 'EMPTY='].join('\n'),
    )
    expect(parseEnvFile(path)).toEqual({
      PLAIN: 'value',
      DQUOTED: 'two words',
      SQUOTED: 'single',
      EMPTY: '',
    })
  })

  it('drops the shell-style export prefix from the key', () => {
    // `export FOO=bar` is valid dotenv syntax; keeping the prefix would sync a
    // variable named "export FOO" that no runtime reads.
    expect(parseEnvFile(scratchFile('.env', 'export TOKEN=abc\n'))).toEqual({ TOKEN: 'abc' })
  })

  it('ignores lines that carry no assignment and returns empty for a missing file', () => {
    expect(parseEnvFile(scratchFile('.env', 'not-an-assignment\n=orphan\n'))).toEqual({})
    expect(parseEnvFile(join(tmpdir(), 'definitely-absent.env'))).toEqual({})
  })
})
