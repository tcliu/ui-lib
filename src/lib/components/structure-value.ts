export interface StructureEntry {
  key: string
  value: unknown
}

export function isContainer(value: unknown): value is object {
  return value !== null && typeof value === 'object'
}

// A non-array object: the shape whose own keys and entries the tree reads. The
// guard keeps every structural read honest instead of asserting the shape.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return isContainer(value) && !Array.isArray(value)
}

export function childEntries(value: unknown): StructureEntry[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => ({ key: String(index), value: item }))
  }
  if (!isRecord(value)) {
    return []
  }
  return Object.entries(value).map(([key, value]) => ({ key, value }))
}

export function containerSummary(value: unknown): string {
  if (Array.isArray(value)) {
    return `array[${value.length}]`
  }
  const count = isRecord(value) ? Object.keys(value).length : 0
  return `object{${count}}`
}

export function valueText(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

export function valueClass(value: unknown): string {
  if (value === null) return 'italic text-slate-400'
  if (typeof value === 'string') return 'text-emerald-300'
  if (typeof value === 'number') return 'text-amber-300'
  if (typeof value === 'boolean') return 'text-sky-300'
  return 'text-slate-300'
}

export function copyValue(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

/** JSONPath display for a node path (`[]` → `$`, `['a','0']` → `$.a[0]`). */
export function jsonPath(path: string[]): string {
  if (path.length === 0) return '$'
  let out = '$'
  for (const seg of path) {
    if (/^(0|[1-9]\d*)$/.test(seg)) {
      out += `[${seg}]`
    } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)) {
      out += `.${seg}`
    } else {
      out += `["${seg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
    }
  }
  return out
}

export function inputText(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  return String(value)
}

export function parseInputValue(input: string): unknown {
  const trimmed = input.trim()
  if (trimmed === 'null') return null
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  const num = Number(trimmed)
  if (trimmed !== '' && Number.isFinite(num)) return num
  return trimmed
}

export function setAtPath(root: unknown, path: string[], value: unknown): unknown {
  if (path.length === 0) return value
  const [key, ...rest] = path
  if (Array.isArray(root)) {
    const index = parseInt(key, 10)
    const next = [...root]
    next[index] = setAtPath(root[index], rest, value)
    return next
  }
  const record = isRecord(root) ? root : {}
  return { ...record, [key]: setAtPath(record[key], rest, value) }
}

// The format a plain-text document reads as: XML when it opens with a tag,
// JSON when it parses, YAML otherwise.
export function detectFormat(text: string): 'json' | 'yaml' | 'xml' {
  if (text.trim().startsWith('<')) return 'xml'
  try {
    JSON.parse(text.trim() || 'null')
    return 'json'
  } catch {
    return 'yaml'
  }
}

export function renameKeyAtPath(root: unknown, path: string[], oldKey: string, newKey: string): unknown {
  if (oldKey === newKey) return root
  if (path.length === 0) {
    if (!isRecord(root)) {
      return root
    }
    if (!(oldKey in root)) {
      return root
    }
    const rebuilt: Record<string, unknown> = {}
    for (const key of Object.keys(root)) {
      if (key === oldKey) {
        rebuilt[newKey] = root[key]
      } else {
        rebuilt[key] = root[key]
      }
    }
    return rebuilt
  }
  const [head, ...rest] = path
  if (Array.isArray(root)) {
    const index = parseInt(head, 10)
    const next = [...root]
    next[index] = renameKeyAtPath(root[index], rest, oldKey, newKey)
    return next
  }
  if (!isRecord(root)) {
    return root
  }
  return {
    ...root,
    [head]: renameKeyAtPath(root[head], rest, oldKey, newKey),
  }
}
