// Show-code source for the Pagination demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above. The
// paging interaction state (total, pageSize, currentPage) reads from scope,
// so it has no sync write-back on the page.
import { escapeAttr, escapeText, sizeAttrLine, textAttrLine } from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'
import type { PaginationLabels } from '$lib/components/pagination-labels'

export interface PaginationSnippetState {
  size: Staged<string>
  // The labels map applies only while its eye toggle is on, mirroring the
  // page (off omits the object prop, so each field falls back to i18n).
  labels: Staged<PaginationLabels>
  // The page-size choices read from scope; the eye omits the prop while off.
  pageSizeOptions: Staged<number[]>
  className: Staged<string>
  trailing: Staged<string>
}

export const STYLED_CLASS = 'rounded-lg border border-cyan-500/40 p-2'

// The preset label overrides behind the Labels control: selecting "Custom"
// fills every field, clearing removes them so each falls back to its i18n key.
export const CUSTOM_LABELS: PaginationLabels = {
  previous: 'Go back',
  next: 'Go forward',
  pageSize: 'Rows',
  current: 'Page number',
  nav: 'Results',
}

// The label fields in declaration order, so the emitted object literal reads
// like the prop and a parse-back can round-trip every facet.
export const LABEL_FIELDS: (keyof PaginationLabels)[] = ['previous', 'next', 'pageSize', 'current', 'nav']

// The default page-size choices behind the page-size dropdown; the builder
// omits the prop while the demo holds exactly these, so Show-code stays minimal.
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50]

// Validate unknown data into page-size options: a non-empty array of positive
// integers only. Anything else returns null, so the dialog applies only shapes
// the builder reproduces exactly.
export function parsePageSizeOptionsValue(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null
  }
  const out: number[] = []
  for (const entry of value) {
    if (typeof entry !== 'number' || !Number.isInteger(entry) || entry <= 0) {
      return null
    }
    out.push(entry)
  }
  return out
}

// Parse a page-size options editor draft (a JSON array of positive integers).
// Returns null for anything else, so the dialog can block OK and explain
// instead of applying a half-shaped list.
export function parsePageSizeOptionsJson(text: string): number[] | null {
  try {
    return parsePageSizeOptionsValue(JSON.parse(text))
  } catch {
    return null
  }
}

// Validate unknown data into label overrides: known fields with string values
// only. Unknown keys or non-string values return null, so the dialog and the
// snippet write-back apply only shapes the builder reproduces exactly. An
// empty object is valid and means unset (every field falls back to i18n).
export function parseLabelsValue(value: unknown): PaginationLabels | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const out: PaginationLabels = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!(LABEL_FIELDS as readonly string[]).includes(key) || typeof entry !== 'string') {
      return null
    }
    ;(out as Record<string, string>)[key] = entry
  }
  return out
}

// Parse a labels editor draft (a JSON object with string previous, next,
// pageSize, current, and nav keys). Returns null for anything else, so the
// dialog can block OK and explain instead of applying half-shaped data.
export function parseLabelsJson(text: string): PaginationLabels | null {
  try {
    return parseLabelsValue(JSON.parse(text))
  } catch {
    return null
  }
}

// Element text for the trailing span below.

// The labels object literal, omitting unset fields (an applied empty label
// stays, matching the demo); absent while its eye is off or no override is set,
// so the cleared form applies nothing.
function labelsLine(pair: Staged<PaginationLabels>): string[] {
  if (!pair.on) return []
  const entries = LABEL_FIELDS.filter(field => pair.value[field] !== undefined).map(
    field => `${field}: "${escapeAttr(pair.value[field] as string)}"`,
  )
  return entries.length ? [`  labels={{ ${entries.join(', ')} }}`] : []
}

// The page-size options attribute, reading the playground scope value; omitted
// while the eye is off or the demo holds the defaults, so the cleared form
// applies nothing.
function pageSizeOptionsLine(pair: Staged<number[]>): string[] {
  if (!pair.on) return []
  if (
    pair.value.length === DEFAULT_PAGE_SIZE_OPTIONS.length &&
    pair.value.every((entry, index) => entry === DEFAULT_PAGE_SIZE_OPTIONS[index])
  ) {
    return []
  }
  return ['  pageSizeOptions={pageSizeOptions}']
}

export function buildPaginationSnippet({
  size,
  labels,
  pageSizeOptions,
  className,
  trailing,
}: PaginationSnippetState): string {
  const hasTrailing = trailing.on && trailing.value !== ''
  const lines = [
    '<Pagination',
    '  total={total}',
    '  pageSize={pageSize}',
    '  currentPage={currentPage}',
    ...pageSizeOptionsLine(pageSizeOptions),
    // The size prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size),
    ...labelsLine(labels),
    ...textAttrLine('className', className),
    ...(hasTrailing ? ['  trailing={trailing}'] : []),
    '  onPageChange={page => (currentPage = page)}',
    ...(hasTrailing
      ? [
          '  onPageSizeChange={handlePageSizeChange}>',
          '  {#snippet trailing()}',
          `    <span>${escapeText(trailing.value)}</span>`,
          '  {/snippet}',
          '</Pagination>',
        ]
      : ['  onPageSizeChange={handlePageSizeChange} />']),
  ]
  return lines.join('\n')
}
