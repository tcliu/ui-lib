// Show-code source for the Menu demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The item list
// lives in a leading script block (data arrays are merged into the compiled
// preamble); labels fall back to scope values while unset.
//
// The demo sits in a width-only `Resizable` frame so the panel placement can be
// inspected as the container narrows. The host is non-scrolling and the frame
// is bounded to it, so no scrollbar can appear over the frame handle. These
// literals are shared with the page and its tests so the rendered stage and
// the reviewed source stay identical.

export type TriState = '' | 'yes' | 'no'

export const MENU_STAGE_HOST = 'w-full overflow-hidden'
export const MENU_STAGE_PANE = 'flex w-full min-w-0 flex-wrap items-start gap-4'
export const MENU_STAGE_CONTENT = 'flex items-center gap-4'
export const MENU_STAGE_DEFAULT_WIDTH = 560
export const MENU_STAGE_MIN_WIDTH = 240

// The snippet's local size state, seeded to the default so the live stage
// matches the static demo before the first drag.
export function menuStageStateLine(indent: string): string {
  return `${indent}let stageWidth = $state(${MENU_STAGE_DEFAULT_WIDTH})`
}

export function menuStageOpenLines(indent: string): string[] {
  return [
    `${indent}<div class="${MENU_STAGE_HOST}">`,
    `${indent}  <Resizable`,
    `${indent}    width={stageWidth}`,
    `${indent}    minWidth={${MENU_STAGE_MIN_WIDTH}}`,
    `${indent}    maxWidth="parent"`,
    `${indent}    onResize={nextWidth => (stageWidth = nextWidth)}`,
    `${indent}  >`,
    `${indent}    <div class="${MENU_STAGE_PANE}">`,
  ]
}

export function menuStageCloseLines(indent: string): string[] {
  return [`${indent}    </div>`, `${indent}  </Resizable>`, `${indent}</div>`]
}

export interface MenuSnippetState {
  align: string
  triggerLabel: string
  firstLabel: string
  secondLabel: string
  autoPlace: TriState
  triggerClass: string
  panelClass: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// A tri-state line: omitted while unset, bare while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string): string[] {
  if (value === '') {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
}

// A string attribute line, omitted while unset.
function textLine(name: string, value: string, indent: string): string[] {
  return value ? [`${indent}${name}="${escapeAttr(value)}"`] : []
}

export function buildMenuSnippet({
  align,
  triggerLabel,
  firstLabel,
  secondLabel,
  autoPlace,
  triggerClass,
  panelClass,
}: MenuSnippetState): string {
  // The content row sits at 6 spaces; the component and the trailing action
  // line at 8, and attributes at 10, matching the stage's inner pane.
  const contentIndent = '      '
  const componentIndent = '        '
  const attributeIndent = '          '
  return [
    '<script>',
    menuStageStateLine('  '),
    '  const menuItems = [',
    // JSON.stringify keeps the script literal valid no matter what the label
    // holds (attribute escaping would leak entities into the JS string).
    `    { id: 'edit', label: ${firstLabel ? JSON.stringify(firstLabel) : 'editLabel'}, onClick: () => (lastAction = editLabel) },`,
    `    { id: 'delete', label: ${secondLabel ? JSON.stringify(secondLabel) : 'deleteLabel'}, onClick: () => (lastAction = deleteLabel) },`,
    '  ]',
    '</script>',
    ...menuStageOpenLines(''),
    `${contentIndent}<div class="${MENU_STAGE_CONTENT}">`,
    `${componentIndent}<Menu`,
    `${attributeIndent}items={menuItems}`,
    `${attributeIndent}itemKey={item => item.id}`,
    `${attributeIndent}onSelect={index => menuItems[index].onClick()}`,
    ...(triggerLabel
      ? [`${attributeIndent}ariaLabel="${escapeAttr(triggerLabel)}"`]
      : [`${attributeIndent}ariaLabel={triggerLabel}`]),
    ...(align ? [`${attributeIndent}align="${align}"`] : []),
    ...flagLine('autoPlace', autoPlace, attributeIndent),
    ...textLine('triggerClass', triggerClass, attributeIndent),
    ...textLine('panelClass', panelClass, attributeIndent),
    `${attributeIndent}itemClass={menuItemClass}`,
    `${attributeIndent}itemLabel={item => item.label}`,
    `${attributeIndent}itemDisabled={item => item.disabled ?? false}>`,
    `${componentIndent}  {#snippet icon()}`,
    `${componentIndent}    <KebabIcon className="h-4 w-4" />`,
    `${componentIndent}  {/snippet}`,
    `${componentIndent}  {#snippet item(item)}`,
    `${componentIndent}    {item.label}`,
    `${componentIndent}  {/snippet}`,
    `${componentIndent}</Menu>`,
    `${componentIndent}<span class="text-sm text-slate-400">last action: {lastAction || '—'}</span>`,
    `${contentIndent}</div>`,
    ...menuStageCloseLines(''),
  ].join('\n')
}
