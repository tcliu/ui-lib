<script lang="ts">
  import type { Snippet } from 'svelte'
  import BaseDialog from './BaseDialog.svelte'
  import Buttons from './Buttons.svelte'
  import Button, { iconOnlyBoxPx } from './Button.svelte'
  import Checkbox from './Checkbox.svelte'
  import DataTable, { type DataTableColumn } from './DataTable.svelte'
  import LazyCodeEditor from './LazyCodeEditor.svelte'
  import NumberInput from './NumberInput.svelte'
  import SelectDropdown from './SelectDropdown.svelte'
  import TextArea from './TextArea.svelte'
  import TextInput from './TextInput.svelte'
  import { INPUT_CHROME, INPUT_METRIC_CLASS, INPUT_RATIOS } from './input-chrome'
  import { dimensionMetrics } from './size-metrics'
  import type { SizeInput } from '$lib/size-scale'
  import EditIcon from '$lib/icons/EditIcon.svelte'
  import EyeIcon from '$lib/icons/EyeIcon.svelte'
  import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'

  export type FieldEditor = 'text' | 'textarea' | 'number' | 'enum' | 'size' | 'boolean' | 'options-json' | 'snippet'

  export interface FieldOption {
    value: string
    label: string
  }

  // Optional refinements for a dialog-backed Value cell. The seed comes from the
  // row's `value` and the commit from its `onChange`, so most rows need no
  // `dialog` object at all.
  export interface FieldDialog {
    // Overrides the default validity check (JSON-parse for a json docType).
    valid?: (draft: string) => boolean
    invalidMessage?: string
    // CodeEditor language; implied by the editor kind — 'json' for options-json
    // rows, 'html' for snippet rows — so it is set only to override that.
    docType?: string
    title?: string
    widthVariant?: import('svelte').ComponentProps<typeof BaseDialog>['widthVariant']
    heightClass?: string
  }

  // Standard fallback for `size` editors: pages only pass `options` to narrow
  // the list, so an option-less size row still offers the named steps.
  const SIZE_OPTIONS: FieldOption[] = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]

  // Dialog-backed rows (snippet or options-json) and primitive rows with
  // toggle config: the eye toggle gates whether the value is applied at the
  // call site. A row without it renders no eye.
  export interface FieldToggle {
    enabled: boolean
    onToggle: (enabled: boolean) => void
  }

  export interface FieldConfig {
    name: string
    type: string
    defaultValue: string
    note: string
    editor?: FieldEditor
    options?: FieldOption[]
    placeholder?: string
    allowCustomValue?: boolean
    clearLabel?: string
    // Shows the Value editor's clear cross (text/number editors only): set it
    // whenever the row has a Value editor — clearing commits the row's literal
    // default (unset when it has none) and Reset restores the prefilled
    // default.
    clearable?: boolean
    // Baseline the editor's clear affordance compares against, and the value
    // an absent snippet attribute or a clear restores: a row's literal default
    // (the `placeholder` stands in when this is omitted, so the Default cell
    // still shows `defaultValue` verbatim). A quoted literal passes its inner
    // text here (defaultValue "'hi'" pairs with editorDefaultValue "hi") while
    // a marker default (—, locale, built-in) omits it and stays unset.
    editorDefaultValue?: string
    value?: string
    onChange?: (value: string) => void
    // Marks the row as a dialog-backed Value cell (its `value` seeds the editor
    // and its `onChange` commits); `dialog` only carries refinements.
    dialog?: FieldDialog
    // The apply/unapply eye toggle: beside the edit icon on dialog-backed
    // rows (snippet or options-json), trailing the input on primitive rows.
    toggle?: FieldToggle
  }

  // Column labels; each key falls back to its English default, so a partial
  // object overrides only the columns it names.
  export interface FieldTableHeaders {
    prop?: string
    type?: string
    default?: string
    value?: string
    note?: string
  }

  interface Props {
    fields: FieldConfig[]
    // Per-row Value cell override. Wins over the built-in editor mapping.
    value?: Snippet<[FieldConfig]>
    headers?: FieldTableHeaders
    size?: SizeInput
  }

  let { fields, value, headers, size = 'md' }: Props = $props()

  const i18n = getI18nContext()

  // Header labels: each falls back to its English default when unset.
  const labels = $derived({
    prop: headers?.prop ?? 'Prop',
    type: headers?.type ?? 'Type',
    default: headers?.default ?? 'Default',
    value: headers?.value ?? 'Value',
    note: headers?.note ?? 'Notes',
  })

  const hasValueColumn = $derived(value != null || fields.some(field => field.editor != null))

  function editorLabel(field: FieldConfig): string {
    const current = field.value ?? ''
    if (current === '') {
      // No meta-hint fallback: blank when the row has no placeholder.
      return field.placeholder ?? ''
    }
    return field.options?.find(option => option.value === current)?.label ?? current
  }

  // The row's literal default: `editorDefaultValue`, else the Value cell's
  // placeholder, else empty (a marker default like — / locale / built-in has
  // none). It backs the editors' clear baseline, the value clearing restores,
  // and the value an absent snippet attribute restores (`syncFieldsOf` reads
  // the same two sources).
  function literalDefault(field: FieldConfig): string {
    return field.editorDefaultValue ?? field.placeholder ?? ''
  }

  // Clearing a Value restores the row default (unsets when the row has no
  // literal default) and unapplies the eye, so the demo and the seed both
  // fall back to the default while the committed default stays visible.
  function clearValue(field: FieldConfig): void {
    field.onChange?.(literalDefault(field))
    field.toggle?.onToggle(false)
  }

  // Long text values edit through a textarea so they stay readable: a `text`
  // row whose value reaches 30 chars renders the area editor instead.
  function isLongText(field: FieldConfig): boolean {
    return (field.value ?? '').length >= 30
  }

  // Natural height of the two-row area editor at the current size. An
  // absolutely-filled area cell keeps an in-flow spacer at this floor, so a
  // row whose area is its tallest content never collapses beneath it.
  function areaFloor(): number {
    const metrics = dimensionMetrics(size, INPUT_RATIOS)
    return metrics.line * 2 + metrics.padY * 2 + 2
  }

  // Right inset the absolute area clears in a toggle row: the cell's right
  // padding (12) plus the row gap (8) plus the rendered box of the ghost
  // icon-only eye. The box is derived from `Button` (the icon slot floored at
  // the text row height) rather than assumed to be the slot, so a row-height
  // retune carries the inset with it instead of leaving the area over the glyph.
  function areaRightInset(): number {
    return 12 + 8 + iconOnlyBoxPx(size)
  }

  // Shift applied to a number row's eye while its outside clear slot is empty:
  // TextInput's trailer gap plus the reserved clear box (its own ratios, both
  // size-scaled like here). NumberInput always shows its steppers in this
  // table, so `auto` placement renders the clear outside beside them.
  function numberEyePull(): number {
    const metrics = dimensionMetrics(size, { gap: 0.375, box: 1 })
    return metrics.gap + metrics.box
  }

  // The slot is empty while the row's clear hides: clearable with the value
  // at the row default (TextInput's own showClear baseline; these rows are
  // never disabled or read-only).
  function numberSlotEmpty(field: FieldConfig): boolean {
    return (field.clearable ?? false) && (field.value ?? '') === literalDefault(field)
  }

  // The area editor fills its Value cell: absolute against the relative cell
  // (see the value column's `cellClass`), so it stretches with tall rows
  // instead of leaving a gap beneath it. Width rides a `max-width` calc —
  // an over-constrained `left` + `right` + `w-full` would drop the inset —
  // and `resize-none` replaces the default `resize-y`: dragging a
  // cell-filling area would desync it from the row.
  const AREA_FILL_CLASS =
    `absolute bottom-2 left-0 top-2 max-w-[calc(100%-var(--area-right,12px))] ` +
    `${INPUT_CHROME} resize-none ${INPUT_METRIC_CLASS}`

  // Column shares of the table width. Both split tables (fixed header band
  // and scrolling body) render the same colgroup, so identical shares keep
  // their columns aligned regardless of content. Shares are rebased to 100
  // when the Value column is absent.
  const columnShares: Record<string, string> = {
    name: '16%',
    type: '24%',
    default: '15%',
    value: '17%',
    note: '28%',
  }

  const columns: DataTableColumn<FieldConfig>[] = $derived.by(() => {
    const list: DataTableColumn<FieldConfig>[] = [
      { key: 'name', header: labels.prop, cell: nameCell, width: columnShares.name },
      { key: 'type', header: labels.type, cell: typeCell, width: columnShares.type },
      { key: 'default', header: labels.default, cell: defaultCell, width: columnShares.default },
    ]
    if (hasValueColumn) {
      // `relative` anchors the absolute area editors, so they stretch with
      // tall rows. Dropdown panels and tooltips portal to `document.body`,
      // so the positioning context never retargets them.
      list.push({ key: 'value', header: labels.value, cell: valueCell, width: columnShares.value, cellClass: 'relative' })
    }
    list.push({ key: 'note', header: labels.note, cell: noteCell, width: columnShares.note })
    return list
  })

  // Owned dialog lifecycle. One dialog is open at a time; `draft` is seeded on
  // open and only committed on OK, so cancelling never touches live state.
  let dialogField = $state<FieldConfig | null>(null)
  let draft = $state('')

  function resolveContent(field: FieldConfig): string {
    return field.value ?? ''
  }

  function openDialog(field: FieldConfig) {
    draft = resolveContent(field)
    dialogField = field
  }

  function closeDialog() {
    dialogField = null
  }

  function saveDialog() {
    dialogField?.onChange?.(draft)
    dialogField = null
  }

  const dialogContent = $derived(dialogField ? resolveContent(dialogField) : '')
  const dialogDirty = $derived(draft !== dialogContent)
  const dialogTitle = $derived(dialogField?.dialog?.title ?? `Edit ${dialogField?.name ?? ''}`)
  const dialogWidthVariant = $derived(dialogField?.dialog?.widthVariant ?? '3xl')
  const dialogDocType = $derived(
    dialogField?.dialog?.docType ?? (dialogField?.editor === 'options-json' ? 'json' : 'html'),
  )
  const dialogHeightClass = $derived(dialogField?.dialog?.heightClass ?? 'h-96')
  const dialogValid = $derived.by(() => {
    if (!dialogField) return true
    if (dialogField.dialog?.valid) return dialogField.dialog.valid(draft)
    if (dialogDocType === 'json') {
      try {
        JSON.parse(draft)
        return true
      } catch {
        return false
      }
    }
    return true
  })
  const dialogInvalidMessage = $derived(
    dialogField?.dialog?.invalidMessage ?? (dialogDocType === 'json' ? i18n.t('common.invalidJson') : ''),
  )
</script>

{#snippet editIcon()}
  <EditIcon />
{/snippet}

{#snippet eyeIcon()}
  <EyeIcon />
{/snippet}

{#snippet eyeSlashIcon()}
  <EyeSlashIcon />
{/snippet}

{#snippet textEditor(field: FieldConfig)}
  <TextInput
    value={field.value ?? ''}
    size={size}
    ariaLabel={`${field.name} value`}
    placeholder={field.placeholder}
    clearable={field.clearable ?? false}
    clearLabel={field.clearLabel ?? `Clear ${field.name}`}
    defaultValue={literalDefault(field)}
    onClear={() => clearValue(field)}
    oninput={event => field.onChange?.((event.target as HTMLInputElement).value)} />
{/snippet}

{#snippet textAreaEditor(field: FieldConfig)}
  <!-- Absolute against the relative Value cell: the area stretches with tall
    rows. The in-flow spacer holds the two-row floor (and the row width
    beside the eye), so short rows keep today's height and the eye never
    spills into the next column. -->
  <div class="flex items-start gap-2" style={field.toggle ? `--area-right:${areaRightInset()}px` : undefined}>
    <div aria-hidden="true" class="min-w-0 flex-1" style="min-height:{areaFloor()}px"></div>
    <TextArea
      value={field.value ?? ''}
      size={size}
      ariaLabel={`${field.name} value`}
      placeholder={field.placeholder}
      rows={2}
      inputClass={AREA_FILL_CLASS}
      oninput={event => field.onChange?.((event.target as HTMLTextAreaElement).value)} />
    {@render applyEye(field)}
  </div>
{/snippet}

{#snippet numberEditor(field: FieldConfig)}
  <NumberInput
    value={field.value ?? ''}
    size={size}
    ariaLabel={`${field.name} value`}
    placeholder={field.placeholder}
    clearable={field.clearable ?? false}
    clearLabel={field.clearLabel ?? `Clear ${field.name}`}
    defaultValue={literalDefault(field)}
    onClear={() => clearValue(field)}
    oninput={event => field.onChange?.((event.target as HTMLInputElement).value)} />
{/snippet}

{#snippet enumEditor(field: FieldConfig)}
  <SelectDropdown
    buttonLabel={editorLabel(field)}
    activeValue={field.value ?? ''}
    defaultValue={literalDefault(field)}
    size={size}
    ariaLabel={`${field.name} value`}
    options={field.options ?? (field.editor === 'size' ? SIZE_OPTIONS : [])}
    filterable={field.editor === 'size' ? true : undefined}
    allowCustomValue={field.editor === 'size' && field.allowCustomValue ? true : undefined}
    onSelect={next => field.onChange?.(next)}
    clearable
    clearLabel={field.clearLabel ?? `Clear ${field.name}`}
    onClear={() => clearValue(field)} />
{/snippet}

{#snippet checkboxEditor(field: FieldConfig)}
  <Checkbox
    checked={field.value === 'yes'}
    size={size}
    ariaLabel={`${field.name} value`}
    onChange={checked => field.onChange?.(checked ? 'yes' : 'no')} />
{/snippet}

{#snippet applyEye(field: FieldConfig)}
  {#if field.toggle}
    <Button
      variant="ghost"
      size={size}
      icon={field.toggle.enabled ? eyeIcon : eyeSlashIcon}
      ariaLabel={field.toggle.enabled ? `Unapply ${field.name}` : `Apply ${field.name}`}
      tooltip={field.toggle.enabled ? `Unapply ${field.name}` : `Apply ${field.name}`}
      onClick={() => field.toggle?.onToggle(!field.toggle.enabled)} />
  {/if}
{/snippet}

{#snippet nameCell(field: FieldConfig)}
  <span class="font-mono break-words text-cyan-300">{field.name}</span>
{/snippet}

{#snippet typeCell(field: FieldConfig)}
  <span class="font-mono break-words text-slate-300">{field.type}</span>
{/snippet}

{#snippet defaultCell(field: FieldConfig)}
  <span class="font-mono break-words text-slate-400">{field.defaultValue}</span>
{/snippet}

{#snippet noteCell(field: FieldConfig)}
  <span class="text-slate-400">{field.note}</span>
{/snippet}

{#snippet valueCell(field: FieldConfig)}
  {#if value}
    {@render value(field)}
  {:else if field.editor === 'text' || field.editor === 'textarea'}
    {#if field.editor === 'textarea' || isLongText(field)}
      {@render textAreaEditor(field)}
    {:else if field.toggle}
      <div class="flex items-center gap-2">
        {@render textEditor(field)}
        {@render applyEye(field)}
      </div>
    {:else}
      {@render textEditor(field)}
    {/if}
  {:else if field.editor === 'number'}
    {#if field.toggle}
      <!-- The number editor fills the remaining row width, so its outside
        clear slot (reserved even while empty) keeps the input the same width
        whether the cross shows or not. While the slot is empty the eye shifts
        over it with a `transform` — paint-only, so the layout (and the input
        width) never moves — sitting against the input instead of hanging at
        the cell edge; while a clear button shows, the eye stays after it. -->
      <div class="flex items-center gap-2">
        <div class="min-w-0 flex-1">
          {@render numberEditor(field)}
        </div>
        <span style={numberSlotEmpty(field) ? `transform:translateX(-${numberEyePull()}px)` : undefined}>
          {@render applyEye(field)}
        </span>
      </div>
    {:else}
      {@render numberEditor(field)}
    {/if}
  {:else if field.editor === 'enum' || field.editor === 'size'}
    {#if field.toggle}
      <div class="flex items-center gap-2">
        {@render enumEditor(field)}
        {@render applyEye(field)}
      </div>
    {:else}
      {@render enumEditor(field)}
    {/if}
  {:else if field.editor === 'boolean'}
    {#if field.toggle}
      <div class="flex items-center gap-2">
        {@render checkboxEditor(field)}
        {@render applyEye(field)}
      </div>
    {:else}
      {@render checkboxEditor(field)}
    {/if}
  {:else if field.editor === 'options-json' || field.editor === 'snippet'}
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size={size}
        icon={editIcon}
        ariaLabel={`Edit ${field.name}`}
        tooltip={`Edit ${field.name}`}
        onClick={() => openDialog(field)} />
      {@render applyEye(field)}
    </div>
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

<!-- Split header and body: the fixed band never scrolls while the body wrapper
  below takes the leftover height, so the vertical scrollbar spans body rows
  only. Both tables share the column shares above, keeping them aligned. -->
<DataTable
  variant="docs"
  rows={fields}
  rowId={field => field.name}
  columns={columns}
  showSearch={false}
  tableClassName="min-w-[36rem]"
  bordered={false}
  bodyScroll
  fillHeight />

{#if dialogField}
  <!-- An action dialog, not a form dialog: the editor's primary applies the
       content, and confirming the unchanged content is still the intended
       action (it commits the seeded canonical value). So the primary stays
       enabled while the content is valid, and dismissing the editor mutates
       nothing. -->
  <BaseDialog
    title={dialogTitle}
    widthVariant={dialogWidthVariant}
    closeLabel={i18n.t('common.close')}
    onCancel={closeDialog}>
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <LazyCodeEditor
          bind:content={draft}
          docType={dialogDocType}
          editorAriaLabel={`${dialogField.name} editor`}
          containerClass={`${dialogHeightClass} overflow-hidden rounded-md border border-slate-700 bg-slate-950`}
          editorClass="h-full" />
        {#if !dialogValid && dialogInvalidMessage}
          <p role="alert" class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {dialogInvalidMessage}
          </p>
        {/if}
      </div>
      <div class="flex-none">
        <Buttons align="right">
          <Button variant="primary" accent="cyan" onClick={saveDialog} disabled={!dialogValid}>
            {i18n.t('common.ok')}
          </Button>
          <Button variant="outline" onClick={() => (draft = dialogContent)} disabled={!dialogDirty}>
            {i18n.t('common.reset')}
          </Button>
        </Buttons>
      </div>
    </div>
  </BaseDialog>
{/if}
