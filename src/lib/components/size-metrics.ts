import { SIZE_PX, type SizeInput } from '$lib/size-scale'

// The size dimension in pixels: a numeric size, or a name aliased to the shared
// scale. Names need no table — they are just the axis values.
export function resolveSize(size: SizeInput): number {
  if (typeof size === 'number' && Number.isFinite(size)) {
    return Math.max(1, size)
  }
  return SIZE_PX[typeof size === 'string' ? size : 'md'] ?? SIZE_PX.md
}

// A proportional metric is ratio × dimension. There is nothing to interpolate
// because the ratio is constant, so no per-step anchor table is needed — names
// resolve through `resolveSize` like any other size.
export function dimensionMetrics<R extends Record<string, number>>(
  size: SizeInput,
  ratios: R,
): { [K in keyof R]: number } {
  const dimension = resolveSize(size)
  const out = {} as { [K in keyof R]: number }
  for (const key of Object.keys(ratios) as (keyof R)[]) {
    out[key] = dimension * ratios[key]
  }
  return out
}

// Render resolved metrics as prefixed CSS custom properties for an element's
// inline `style`; the element's own static utility set consumes them. Prefixing
// per component keeps nested instances from colliding. Every metric is a length,
// so each value is emitted in pixels.
export function sizeVarStyle(prefix: string, metrics: Record<string, number>): string {
  return Object.entries(metrics)
    .map(([key, value]) => {
      // camelCase metric keys become kebab-case custom properties
      // (`padY` → `--btn-pad-y`) so the static utilities can reference them.
      const name = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      return `--${prefix}-${name}:${value}px`
    })
    .join(';')
}
