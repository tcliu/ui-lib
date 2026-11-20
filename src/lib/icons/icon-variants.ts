// The variant registry: which glyphs carry more than one rendering of the same
// mark, and the stroke treatment each rendering uses. A glyph whose concept
// already exists in the set at a different weight or treatment takes the
// existing name and selects its rendering here, rather than shipping a second
// icon for the same concept.
//
// The chevron family's own weight ladder lives in `chevron-stroke.ts`; the
// double chevrons carry a third, fuller rendering, the copy and edit marks
// carry their own, the delete mark adds its row/column band markers, the filter
// mark adds a spreadsheet-style bar rendering, and the table mark adds the four
// insert edges. The icon viewport spec reads this registry, so each rendering's
// geometry is validated against its own stroke treatment instead of against the
// union of the glyph's renderings.
import { CHEVRON_STYLE, CHEVRON_VARIANTS, type ChevronStrokeStyle } from './chevron-stroke'

export interface IconVariantLadder {
  /** The variant names, in the order the glyph authors its renderings. */
  variants: readonly string[]
  /** The stroke treatment for each rendering, parallel to `variants`. */
  styles: readonly ChevronStrokeStyle[]
}

// The double chevrons: the same repeated-chevron mark at three weights. The
// `heavy` rendering is the full-extent, gapless mark — the heavier, chunkier
// treatment a collapse affordance wants, where the two chevrons close up.
export const DOUBLE_CHEVRON_VARIANTS = ['regular', 'bold', 'heavy'] as const
export type DoubleChevronVariant = (typeof DOUBLE_CHEVRON_VARIANTS)[number]
export const DOUBLE_CHEVRON_STYLE: Record<(typeof DOUBLE_CHEVRON_VARIANTS)[number], ChevronStrokeStyle> = {
  regular: { stroke: 2.43, linecap: 'round', linejoin: 'round' },
  bold: { stroke: 4.5, linecap: 'butt', linejoin: 'miter' },
  heavy: { stroke: 3.33, linecap: 'round', linejoin: 'round' },
}

// The copy mark: `regular` is the set's large overlapping pair, `compact` the
// tighter pair a second, adjacent copy action needs to stay distinguishable.
export const COPY_VARIANTS = ['regular', 'compact'] as const
export type CopyVariant = (typeof COPY_VARIANTS)[number]
export const COPY_STYLE: Record<(typeof COPY_VARIANTS)[number], ChevronStrokeStyle> = {
  regular: { stroke: 2.43, linecap: 'round', linejoin: 'round' },
  compact: { stroke: 2.14, linecap: 'round', linejoin: 'round' },
}

// The edit mark: `regular` is the outlined pencil with its rule, `solid` the
// filled pencil, for an affordance that already sits among filled marks.
export const EDIT_VARIANTS = ['regular', 'solid'] as const
export type EditVariant = (typeof EDIT_VARIANTS)[number]
export const EDIT_STYLE: Record<(typeof EDIT_VARIANTS)[number], ChevronStrokeStyle> = {
  regular: { stroke: 1.82, linecap: 'round', linejoin: 'round' },
  solid: { stroke: 0, linecap: 'round', linejoin: 'round' },
}

// The delete mark: `regular` is the set's filled trash can; `rows` and
// `columns` keep the can as an outline and mark the affected band inside it.
// Their line weights are the ones those marks were authored at, so the body
// reads lighter than the selected band.
export const DELETE_VARIANTS = ['regular', 'rows', 'columns'] as const
export type DeleteVariant = (typeof DELETE_VARIANTS)[number]
export const DELETE_STYLE: Record<(typeof DELETE_VARIANTS)[number], ChevronStrokeStyle> = {
  regular: { stroke: 0, linecap: 'round', linejoin: 'round' },
  rows: { stroke: 2.35, linecap: 'round', linejoin: 'round' },
  columns: { stroke: 1.82, linecap: 'round', linejoin: 'round' },
}

// The filter mark: `regular` is the solid funnel; `sheets` renders the
// spreadsheet app's three-bar funnel, the lighter mark a dense header row
// wants. Both are filled, so the stroke treatment is the filled sentinel.
export const FILTER_VARIANTS = ['regular', 'sheets'] as const
export type FilterVariant = (typeof FILTER_VARIANTS)[number]
export const FILTER_STYLE: Record<(typeof FILTER_VARIANTS)[number], ChevronStrokeStyle> = {
  regular: { stroke: 0, linecap: 'round', linejoin: 'round' },
  sheets: { stroke: 0, linecap: 'round', linejoin: 'round' },
}

// The table mark: `regular` is the table frame with its header and column
// rules; the insert renderings replace those rules with the band boundary and
// the insertion tick, naming the row/column edge they add.
const TABLE_SPACE_STYLE: ChevronStrokeStyle = { stroke: 2.05, linecap: 'round', linejoin: 'round' }
export const TABLE_VARIANTS = [
  'regular',
  'insertRowAbove',
  'insertRowBelow',
  'insertColumnBefore',
  'insertColumnAfter',
] as const
export type TableVariant = (typeof TABLE_VARIANTS)[number]
export const TABLE_STYLE: Record<(typeof TABLE_VARIANTS)[number], ChevronStrokeStyle> = {
  regular: TABLE_SPACE_STYLE,
  insertRowAbove: TABLE_SPACE_STYLE,
  insertRowBelow: TABLE_SPACE_STYLE,
  insertColumnBefore: TABLE_SPACE_STYLE,
  insertColumnAfter: TABLE_SPACE_STYLE,
}

/**
 * Every glyph that carries variants, keyed by its file name in `src/lib/icons`.
 * The spec pairs each rendering with its style through this table.
 */
export const VARIANT_LADDERS: Record<string, IconVariantLadder> = {
  'ChevronDownIcon.svelte': { variants: CHEVRON_VARIANTS, styles: CHEVRON_VARIANTS.map((v) => CHEVRON_STYLE[v]) },
  'ChevronLeftIcon.svelte': { variants: CHEVRON_VARIANTS, styles: CHEVRON_VARIANTS.map((v) => CHEVRON_STYLE[v]) },
  'ChevronRightIcon.svelte': { variants: CHEVRON_VARIANTS, styles: CHEVRON_VARIANTS.map((v) => CHEVRON_STYLE[v]) },
  'ChevronUpIcon.svelte': { variants: CHEVRON_VARIANTS, styles: CHEVRON_VARIANTS.map((v) => CHEVRON_STYLE[v]) },
  'DoubleChevronDownIcon.svelte': { variants: DOUBLE_CHEVRON_VARIANTS, styles: DOUBLE_CHEVRON_VARIANTS.map((v) => DOUBLE_CHEVRON_STYLE[v]) },
  'DoubleChevronLeftIcon.svelte': { variants: DOUBLE_CHEVRON_VARIANTS, styles: DOUBLE_CHEVRON_VARIANTS.map((v) => DOUBLE_CHEVRON_STYLE[v]) },
  'DoubleChevronRightIcon.svelte': { variants: DOUBLE_CHEVRON_VARIANTS, styles: DOUBLE_CHEVRON_VARIANTS.map((v) => DOUBLE_CHEVRON_STYLE[v]) },
  'DoubleChevronUpIcon.svelte': { variants: DOUBLE_CHEVRON_VARIANTS, styles: DOUBLE_CHEVRON_VARIANTS.map((v) => DOUBLE_CHEVRON_STYLE[v]) },
  'CopyIcon.svelte': { variants: COPY_VARIANTS, styles: COPY_VARIANTS.map((v) => COPY_STYLE[v]) },
  'DeleteIcon.svelte': { variants: DELETE_VARIANTS, styles: DELETE_VARIANTS.map((v) => DELETE_STYLE[v]) },
  'EditIcon.svelte': { variants: EDIT_VARIANTS, styles: EDIT_VARIANTS.map((v) => EDIT_STYLE[v]) },
  'FilterIcon.svelte': { variants: FILTER_VARIANTS, styles: FILTER_VARIANTS.map((v) => FILTER_STYLE[v]) },
  'TableIcon.svelte': { variants: TABLE_VARIANTS, styles: TABLE_VARIANTS.map((v) => TABLE_STYLE[v]) },
}
