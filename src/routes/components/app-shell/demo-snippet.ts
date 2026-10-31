// Show-code source for the AppShell demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. Labels come from the
// page `scope` (never the page's i18n helper, which the playground does not
// expose), and the markup mirrors the static demo exactly.
//
// AppShell is the one demo whose stage is an `Resizable` frame rather than the
// shared `ShowcaseStage`: the shell measures its own container to pick between
// docked and floating, so the container itself must be resizable to inspect that
// behaviour. The frame is the only wrapper — it carries the demo chrome and the
// size — so the shell renders its own real default classes inside it, matching a
// consumer's usage.

// The frame chrome and sizing on the `Resizable` itself; `w-full` is what the
// frame's own `maxWidth="parent"` measures against, and `overflow-hidden`
// contains the demo without a scrollbar over the frame handles.
import { enumAttrLine, escapeRawLine, textAttrLine } from '$showcase/snippet-build'
import type { Staged } from '$showcase/staged'

export const SHELL_STAGE_FRAME = 'w-full overflow-hidden rounded-lg border border-slate-800'
export const SHELL_STAGE_DEFAULT_WIDTH = 840
export const SHELL_STAGE_DEFAULT_HEIGHT = 420
export const SHELL_STAGE_MIN_WIDTH = 320
export const SHELL_STAGE_MIN_HEIGHT = 240
export const SHELL_STAGE_MAX_HEIGHT = 720

// A left-pane nav item that stays legible in the rail: the icon survives and the
// label drops out once the pane narrows to its strip. The pane aside is a query
// container (see AppShellPane), so the label's `@max-[8rem]:hidden` tracks the
// pane's own width — a collapsed rail shows only the icon, and nothing spills
// across the splitter. Shared so the static demo and the Show-code source match.
export const SHELL_PANE_ITEM = 'flex items-center gap-2 px-3 py-2 text-sm text-slate-300'
export const SHELL_PANE_LABEL = 'min-w-0 truncate @max-[8rem]:hidden'

// The children/footer snippet markup the page renders and the row dialogs edit.
// The wrapper classes are fixed (the static demo cannot reproduce arbitrary
// attributes), so a dialog draft is valid only in this exact shape.
export const SHELL_CHILDREN_CLASS = 'p-4 text-sm text-slate-300'
export const SHELL_FOOTER_ROW_CLASS = 'flex min-w-0 flex-1 items-center justify-between gap-4'
export const SHELL_FOOTER_TEXT_CLASS = 'text-xs text-slate-400'

// The snippet's local size state, seeded to the defaults so the live stage
// matches the static demo before the first drag.
export function shellStageStateLine(indent: string): string {
  return (
    `${indent}let stageWidth = $state(${SHELL_STAGE_DEFAULT_WIDTH})\n` +
    `${indent}let stageHeight = $state(${SHELL_STAGE_DEFAULT_HEIGHT})`
  )
}

// Show-code lines for the stage frame; the caller writes the shell between the
// open and close lines.
export function shellStageOpenLines(indent: string): string[] {
  return [
    `${indent}<Resizable`,
    `${indent}  className="${SHELL_STAGE_FRAME}"`,
    `${indent}  width={stageWidth}`,
    `${indent}  height={stageHeight}`,
    `${indent}  minWidth={${SHELL_STAGE_MIN_WIDTH}}`,
    `${indent}  minHeight={${SHELL_STAGE_MIN_HEIGHT}}`,
    `${indent}  maxWidth="parent"`,
    `${indent}  maxHeight={${SHELL_STAGE_MAX_HEIGHT}}`,
    `${indent}  onResize={(nextWidth, nextHeight) => { stageWidth = nextWidth; stageHeight = nextHeight; }}`,
    `${indent}>`,
  ]
}

export function shellStageCloseLines(indent: string): string[] {
  return [`${indent}</Resizable>`]
}

// Serializable pane config: the `left`/`right` object props minus their
// callback fields (`onOpenChange`/`onSizeChange`/`onDragEnd`), which the page
// supplies internally so the JSON dialog never carries functions.
export interface AppShellPaneJson {
  open?: boolean
  size?: number
  collapseMode?: 'hide' | 'rail'
  railWidth?: number
  min?: number
  max?: number
  defaultSize?: number
  storageKey?: string
  resizeLabel?: string
  paneLabel?: string
}

// Extra classes per shell region. All keys optional; `null` (or a missing or
// empty entry) counts as unset, so the dialog can prefill every known key
// with `null` as self-documenting filler like the pane configs.
export interface AppShellClassNamesJson {
  header?: string
  footer?: string
  pane?: string
  rightPane?: string
  main?: string
  splitter?: string
}

export interface AppShellSnippetState {
  mode: Staged<string>
  className: Staged<string>
  closeLabel: Staged<string>
  // The class-name map applies only while its eye toggle is on, mirroring the
  // page (off omits the object prop).
  classNames: Staged<AppShellClassNamesJson>
  // The pane configs apply only while their eye toggle is on, mirroring the
  // page (off omits the object prop, so the component default renders).
  left: Staged<AppShellPaneJson>
  right: Staged<AppShellPaneJson>
  // Raw HTML children markup committed from the Value column's dialog; empty
  // renders the canonical padded <p> with the localized `{bodyText}` default.
  // Its eye gates whether the snippet is applied at all.
  children: Staged<string>
  // The header is fixed documentation markup, so its pair carries only the eye
  // toggle that applies it.
  header: Staged<string>
  // The pane content texts apply only while their eye toggle is on, mirroring
  // the page (off omits the prop); the texts are preserved while off.
  leftPane: Staged<string>
  rightPane: Staged<string>
  // Footer snippet markup (the whole block); its eye gates whether it renders.
  // A snippet prop, so the block lives in the snippet body, outside the tag
  // attributes the sync scanner reads.
  footer: Staged<string>
}

// Verbatim footer lines carry the user's labels, so `&` is escaped for
// compilation (Svelte decodes it back), matching the static demo's literal text.

// One entry in an object-literal prop; null while unset so the component default
// applies, exactly as the demo passes `undefined` for an unset field.
function booleanEntry(name: string, value: boolean | undefined): string | null {
  return value === undefined ? null : `${name}: ${value}`
}

function numberEntry(name: string, value: number | undefined): string | null {
  return value === undefined ? null : `${name}: ${value}`
}

function stringEntry(name: string, value: string | undefined): string | null {
  return value ? `${name}: ${JSON.stringify(value)}` : null
}

// A multi-line object-literal attribute (`left={{ … }}`); omitted entirely when
// no entry is set, so an unset config leaves the component default in place.
function objectAttr(name: string, entries: (string | null)[], indent: string): string[] {
  const keys = entries.filter((entry): entry is string => entry !== null)
  if (keys.length === 0) {
    return []
  }
  return [`${indent}${name}={{`, ...keys.map(key => `${indent}  ${key},`), `${indent}}}`]
}

// One pane's non-default fields, in a stable order so the seed stays diffable.
function paneEntries(pane: AppShellPaneJson): (string | null)[] {
  return [
    booleanEntry('open', pane.open),
    numberEntry('size', pane.size),
    stringEntry('collapseMode', pane.collapseMode),
    numberEntry('railWidth', pane.railWidth),
    numberEntry('min', pane.min),
    numberEntry('max', pane.max),
    numberEntry('defaultSize', pane.defaultSize),
    stringEntry('storageKey', pane.storageKey),
    stringEntry('resizeLabel', pane.resizeLabel),
    stringEntry('paneLabel', pane.paneLabel),
  ]
}

// The pane dialog's canonical key order, so the editor seed stays diffable no
// matter what order a hand edit introduced.
const PANE_JSON_ORDER: (keyof AppShellPaneJson)[] = [
  'open',
  'size',
  'collapseMode',
  'railWidth',
  'min',
  'max',
  'defaultSize',
  'storageKey',
  'resizeLabel',
  'paneLabel',
]

// Validate unknown data into a pane config (every entry the documented
// serializable shape). Returns null for anything else, so the dialog and the
// snippet write-back apply only well-shaped configs that round-trip exactly.
// Unknown keys are rejected: a function-valued entry (e.g. `onOpenChange`)
// never survives the JSON editor — callbacks ride the demo object internally.
// A `null` entry counts as unset (the component default applies), so the
// dialog can prefill every known key with `null` as self-documenting filler.
export function parsePaneValue(value: unknown): AppShellPaneJson | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!(PANE_JSON_ORDER as readonly string[]).includes(key)) {
      return null
    }
  }
  const { open, size, collapseMode, railWidth, min, max, defaultSize, storageKey, resizeLabel, paneLabel } =
    record
  const out: AppShellPaneJson = {}
  if (open !== undefined && open !== null) {
    if (typeof open !== 'boolean') {
      return null
    }
    out.open = open
  }
  for (const [key, entry] of [
    ['size', size],
    ['railWidth', railWidth],
    ['min', min],
    ['max', max],
    ['defaultSize', defaultSize],
  ] as const) {
    if (entry !== undefined && entry !== null) {
      if (typeof entry !== 'number' || !Number.isFinite(entry)) {
        return null
      }
      out[key] = entry
    }
  }
  if (collapseMode !== undefined && collapseMode !== null) {
    if (collapseMode !== 'hide' && collapseMode !== 'rail') {
      return null
    }
    out.collapseMode = collapseMode
  }
  for (const [key, entry] of [
    ['storageKey', storageKey],
    ['resizeLabel', resizeLabel],
    ['paneLabel', paneLabel],
  ] as const) {
    if (entry !== undefined && entry !== null) {
      if (typeof entry !== 'string') {
        return null
      }
      out[key] = entry
    }
  }
  return out
}

// Parse a pane editor draft (a JSON object of the serializable config).
// Returns null for anything else, so the dialog can block OK and explain
// instead of applying half-shaped data.
export function parsePaneJson(text: string): AppShellPaneJson | null {
  try {
    return parsePaneValue(JSON.parse(text))
  } catch {
    return null
  }
}

// Read a `left={{ … }}` / `right={{ … }}` tag attribute back out of snippet
// source for the Value-column write-back. The builder emits plain-data object
// literals, so the expression evaluates to JSON-compatible data; anything else
// (including a hand-added function entry) returns null and leaves the
// playground alone.
export function parsePaneExpression(expression: string): AppShellPaneJson | null {
  try {
    return parsePaneValue(new Function(`return (${expression})`)())
  } catch {
    return null
  }
}

// The class-name dialog's canonical key order, matching the seed emission.
const CLASS_NAMES_ORDER: (keyof AppShellClassNamesJson)[] = [
  'header',
  'footer',
  'pane',
  'rightPane',
  'main',
  'splitter',
]

// The dialog seed for a pane config: every known key prefilled in canonical
// order, `null` wherever unset so the component default still applies. The
// template documents the available keys without applying any override.
export function paneJsonText(pane: AppShellPaneJson): string {
  return JSON.stringify(
    {
      open: pane.open ?? null,
      size: pane.size ?? null,
      collapseMode: pane.collapseMode ?? null,
      railWidth: pane.railWidth ?? null,
      min: pane.min ?? null,
      max: pane.max ?? null,
      defaultSize: pane.defaultSize ?? null,
      storageKey: pane.storageKey ?? null,
      resizeLabel: pane.resizeLabel ?? null,
      paneLabel: pane.paneLabel ?? null,
    },
    null,
    2,
  )
}

// Validate unknown data into a class-name map (every entry a region string).
// Returns null for anything else, so the dialog and the snippet write-back
// apply only well-shaped maps that round-trip exactly. Unknown keys are
// rejected, and `null`/missing/empty entries count as unset (the region keeps
// its built-in classes).
export function parseClassNamesValue(value: unknown): AppShellClassNamesJson | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!(CLASS_NAMES_ORDER as readonly string[]).includes(key)) {
      return null
    }
  }
  const out: AppShellClassNamesJson = {}
  for (const key of CLASS_NAMES_ORDER) {
    const entry = record[key]
    if (entry !== undefined && entry !== null && entry !== '') {
      if (typeof entry !== 'string') {
        return null
      }
      out[key] = entry
    }
  }
  return out
}

// Parse a class-name editor draft (a JSON object of region classes).
// Returns null for anything else, so the dialog can block OK and explain
// instead of applying half-shaped data.
export function parseClassNamesJson(text: string): AppShellClassNamesJson | null {
  try {
    return parseClassNamesValue(JSON.parse(text))
  } catch {
    return null
  }
}

// Read a `classNames={{ … }}` tag attribute back out of snippet source for the
// Value-column write-back. The builder emits plain-data object literals, so
// the expression evaluates to JSON-compatible data; anything else returns
// null and leaves the playground alone.
export function parseClassNamesExpression(expression: string): AppShellClassNamesJson | null {
  try {
    return parseClassNamesValue(new Function(`return (${expression})`)())
  } catch {
    return null
  }
}

// The dialog seed for a class-name map: every known key prefilled in canonical
// order, `null` wherever unset so the built-in classes still apply. The
// template documents the available keys without applying any override.
export function classNamesJsonText(classNames: AppShellClassNamesJson): string {
  return JSON.stringify(
    {
      header: classNames.header ?? null,
      footer: classNames.footer ?? null,
      pane: classNames.pane ?? null,
      rightPane: classNames.rightPane ?? null,
      main: classNames.main ?? null,
      splitter: classNames.splitter ?? null,
    },
    null,
    2,
  )
}

// A text node for the seed: the literal when customized — a quoted Svelte
// expression, with `<` escaped so it can neither close the leading script nor
// be mistaken for the demo tag — else the localized scope ref.
function textNode(value: string, scopeRef: string): string {
  if (!value) {
    return `{${scopeRef}}`
  }
  return `{${JSON.stringify(value).replace(/</g, '\\u003c')}}`
}

// The canonical default children markup: a single padded <p> wrapping the
// resolved text. A committed `children` override replaces it with free-form
// HTML, which `parseAppShellChildren` validates before the demo renders it.
export function appShellChildrenMarkup(text: string): string {
  return `<p class="${SHELL_CHILDREN_CLASS}">${text}</p>`
}

// The left-pane label markup: the caller-style row with a menu glyph and the
// label text span. `parseAppShellLeftPane` accepts exactly this shape, so the
// row dialog edits only the label text.
export function appShellLeftPaneMarkup(label: string): string {
  return [
    `<span class="${SHELL_PANE_ITEM}">`,
    '  <MenuIcon className="shrink-0" />',
    `  <span class="${SHELL_PANE_LABEL}">${label}</span>`,
    '</span>',
  ].join('\n')
}

// Left-pane label text from a dialog draft; null unless the draft is exactly
// the canonical row (the fixed classes and glyph cannot vary). Brackets in
// the pane classes are matched literally, not as regex character classes.
export function parseAppShellLeftPane(draft: string): string | null {
  const normalized = draft.trim().replace(/\s+/g, ' ')
  const itemClass = SHELL_PANE_ITEM.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const labelClass = SHELL_PANE_LABEL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = normalized.match(
    new RegExp(
      `^<span class="${itemClass}"> <MenuIcon className="shrink-0" /> <span class="${labelClass}">([^<{}]*)</span> </span>$`,
    ),
  )
  return match ? match[1] : null
}

// The right-pane text markup: a single padded <p> whose class is fixed, so
// only its text is editable. `parseAppShellRightPane` accepts exactly this
// shape.
export function appShellRightPaneMarkup(text: string): string {
  return `<p class="px-3 py-2 text-sm text-slate-300">${text}</p>`
}

// Right-pane text from a dialog draft; null unless the draft is exactly the
// canonical <p> wrapper.
export function parseAppShellRightPane(draft: string): string | null {
  const match = draft.trim().match(new RegExp(`^<p class="px-3 py-2 text-sm text-slate-300">([^<{\\n]*)</p>$`))
  return match ? match[1] : null
}

// The fixed header markup: a left-pane toggle plus the demo title. Not
// user-editable (its callbacks arrive as snippet params), so no parse
// counterpart; the row documents the shape instead.
export const APP_SHELL_HEADER_MARKUP = [
  '{#snippet header(api)}',
  '  {@const toggleLabel = api.open ? hideLabel : showLabel}',
  '  <Button variant="secondary" className="-ml-1" ariaLabel={toggleLabel} ariaExpanded={api.open} tooltip={toggleLabel} tooltipAlign="left" preventFocusSteal onClick={api.toggleLeft}>',
  '    {#snippet icon()}<MenuIcon />{/snippet}',
  '  </Button>',
  '  <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{demoTitle}</span>',
  '{/snippet}',
].join('\n')

// Tags that never carry children, so they need no matching close tag.
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

// One HTML tag: opening, closing, or self-closing. Quoted attribute values may
// contain `<`/`>` without ending the tag.
const CHILDREN_TAG_RE = /<\/?([a-zA-Z][\w.-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g

// Validate a children draft as free-form HTML the demo can reproduce exactly
// through `{@html}` and the seed can emit verbatim. Null unless it is
// well-formed balanced markup whose constructs the browser and the Svelte
// compiler render identically: a `{…}` expression, comment, `<script>`/
// `<style>`/`<slot>`, a capitalized (component) tag, a Svelte directive
// (`class:`, `bind:`, `transition:`, …), an `on*=` handler, or a self-closing
// non-void tag would otherwise render differently from the compiled seed.
// Returns the trimmed markup.
export function parseAppShellChildren(draft: string): string | null {
  const markup = draft.trim()
  if (markup === '' || /[{}]/.test(markup) || markup.includes('<!--')) {
    return null
  }
  if (/<\/?(?:script|style|slot)(?=[\s>/])/i.test(markup) || /<svelte:/i.test(markup)) {
    return null
  }
  const stack: string[] = []
  let cursor = 0
  for (const match of markup.matchAll(CHILDREN_TAG_RE)) {
    const raw = match[0]!
    const at = match.index ?? cursor
    if (markup.slice(cursor, at).includes('<')) {
      return null
    }
    cursor = at + raw.length
    const name = match[1]!
    const lower = name.toLowerCase()
    if (raw.startsWith('</')) {
      if (stack.pop() !== lower) {
        return null
      }
      continue
    }
    // A capitalized tag is a Svelte component in the seed, not an element.
    if (/^[A-Z]/.test(name)) {
      return null
    }
    // Attribute names: a `:` is a Svelte directive and `on*=` an event handler;
    // both compile in the seed but stay literal under `{@html}`. Quoted values
    // are stripped first so a name word inside a value never trips the check.
    const names = (match[2] ?? '').replace(/"[^"]*"|'[^']*'/g, ' ')
    if (names.includes(':') || /\son\w+\s*=/i.test(names)) {
      return null
    }
    if (match[3] === '/') {
      // HTML ignores `/>` on a non-void element, so it would not reproduce.
      if (!VOID_TAGS.has(lower)) {
        return null
      }
    } else if (!VOID_TAGS.has(lower)) {
      stack.push(lower)
    }
  }
  if (markup.slice(cursor).includes('<') || stack.length > 0) {
    return null
  }
  return markup
}

export interface AppShellFooter {
  nav: string
  title: string
}

// The canonical footer markup: two text spans in a justified row. The row's
// dialog edits this whole block, so the two labels need no separate fields.
export function appShellFooterMarkup(nav: string, title: string): string {
  return [
    `<div class="${SHELL_FOOTER_ROW_CLASS}">`,
    `  <span class="${SHELL_FOOTER_TEXT_CLASS}">${nav}</span>`,
    `  <span class="${SHELL_FOOTER_TEXT_CLASS}">${title}</span>`,
    '</div>',
  ].join('\n')
}

// Parse a footer draft to its two labels; null unless it is the canonical row.
// The fixed classes and two-span shape are the only layout the demo can render.
export function parseAppShellFooter(draft: string): AppShellFooter | null {
  const re = new RegExp(
    `^<div class="${SHELL_FOOTER_ROW_CLASS}">\\s*` +
      `<span class="${SHELL_FOOTER_TEXT_CLASS}">([^<{\\n]*)</span>\\s*` +
      `<span class="${SHELL_FOOTER_TEXT_CLASS}">([^<{\\n]*)</span>\\s*` +
      `</div>$`,
  )
  const match = draft.trim().match(re)
  return match ? { nav: match[1], title: match[2] } : null
}

// Normalize a committed footer draft to the canonical markup, so the stored
// value and the Show-code seed reproduce the static demo exactly.
export function normalizeAppShellFooter(draft: string): string {
  const parsed = parseAppShellFooter(draft)
  return parsed ? appShellFooterMarkup(parsed.nav, parsed.title) : draft.trim()
}

export function buildAppShellSnippet({
  mode,
  className,
  closeLabel,
  classNames,
  left,
  right,
  children,
  header,
  leftPane,
  rightPane,
  footer,
}: AppShellSnippetState): string {
  // The component sits at 2 spaces inside the frame; its attributes at 4.
  const componentIndent = '  '
  const attributeIndent = '    '
  return [
    '<script>',
    shellStageStateLine('  '),
    '</script>',
    ...shellStageOpenLines(''),
    `${componentIndent}<AppShell`,
    ...textAttrLine('className', className, attributeIndent),
    // The mode Value prefills the component default; the builder omits it so
    // Show-code stays minimal.
    ...enumAttrLine('mode', mode, 'auto', attributeIndent),
    ...textAttrLine('closeLabel', closeLabel, attributeIndent),
    ...(classNames.on
      ? objectAttr(
          'classNames',
          [
            stringEntry('header', classNames.value.header),
            stringEntry('footer', classNames.value.footer),
            stringEntry('pane', classNames.value.pane),
            stringEntry('rightPane', classNames.value.rightPane),
            stringEntry('main', classNames.value.main),
            stringEntry('splitter', classNames.value.splitter),
          ],
          attributeIndent,
        )
      : []),
    ...(left.on ? objectAttr('left', paneEntries(left.value), attributeIndent) : []),
    ...(right.on ? objectAttr('right', paneEntries(right.value), attributeIndent) : []),
    `${componentIndent}>`,
    ...(header.on
      ? [
          '    {#snippet header(api)}',
          '      {@const toggleLabel = api.open ? hideLabel : showLabel}',
          '      <Button variant="secondary" className="-ml-1" ariaLabel={toggleLabel} ariaExpanded={api.open} tooltip={toggleLabel} tooltipAlign="left" preventFocusSteal onClick={api.toggleLeft}>',
          '        {#snippet icon()}<MenuIcon />{/snippet}',
          '      </Button>',
          '      <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">{demoTitle}</span>',
          '    {/snippet}',
        ]
      : []),
    ...(leftPane.on
      ? [
          '    {#snippet leftPane()}',
          `      <span class="${SHELL_PANE_ITEM}">`,
          '        <MenuIcon className="shrink-0" />',
          `        <span class="${SHELL_PANE_LABEL}">${textNode(leftPane.value, 'navLabel')}</span>`,
          '      </span>',
          '    {/snippet}',
        ]
      : []),
    ...(right.value.open === true && right.on && rightPane.on
      ? [
          '    {#snippet rightPane()}',
          `      <p class="px-3 py-2 text-sm text-slate-300">${textNode(rightPane.value, 'bodyText')}</p>`,
          '    {/snippet}',
        ]
      : []),
    ...(footer.on
      ? [
          '    {#snippet footer()}',
          ...footer.value.split('\n').map(line => `      ${escapeRawLine(line)}`),
          '    {/snippet}',
        ]
      : []),
    // Committed children emit their HTML verbatim: the demo renders it through
    // `{@html}`, so entities pass through untouched. Unset renders the canonical
    // padded <p> reading the localized body text from scope.
    ...(children.on
      ? children.value
        ? children.value.split('\n').map(line => `    ${line}`)
        : [`    <p class="${SHELL_CHILDREN_CLASS}">{bodyText}</p>`]
      : []),
    `${componentIndent}</AppShell>`,
    ...shellStageCloseLines(''),
  ].join('\n')
}
