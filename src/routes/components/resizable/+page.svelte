<script lang="ts">
  import Resizable from '$lib/components/Resizable.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { textField, resetToggle, snippetDialog, snippetField, snippetToggle } from '$showcase/snippet-field'
  import {
    RESIZABLE_CONTENT,
    RESIZABLE_DEFAULT_HEIGHT,
    RESIZABLE_DEFAULT_WIDTH,
    RESIZABLE_SCROLLPORT,
    buildResizableChildrenMarkup,
    buildResizableSnippet,
    parseBound,
    parseMaxBound,
    parseResizableChildrenMarkup,
  } from './demo-snippet'

  // Customizer playground state. Every bound starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below. The max bounds carry the non-numeric
  // marker (unbounded), so only the numeric `0` minimums prefill; the live
  // width/height stay interaction state.
  let pgMinWidth = $state('0')
  let pgMinWidthOn = $state(false)
  let pgMinHeight = $state('0')
  let pgMinHeightOn = $state(false)
  let pgMaxWidth = $state('')
  let pgMaxWidthOn = $state(false)
  let pgMaxHeight = $state('')
  let pgMaxHeightOn = $state(false)
  // The content div class edits through the dialog; the label reads live size
  // from state, so the class is the only facet.
  let pgContentClass = $state('')
  // The component requires children, so the eye resets to the default class
  // instead of omitting; committing re-applies.
  let pgChildrenEnabled = $state(true)
  // Size is interaction state, not a curated option, so it stays out of the
  // curated form.
  let pgWidth = $state(RESIZABLE_DEFAULT_WIDTH)
  let pgHeight = $state(RESIZABLE_DEFAULT_HEIGHT)
  // Unset, the container renders no extra classes.
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)

  const minWidth = $derived(pgMinWidthOn ? (parseBound(pgMinWidth) ?? undefined) : undefined)
  const minHeight = $derived(pgMinHeightOn ? (parseBound(pgMinHeight) ?? undefined) : undefined)
  const maxWidth = $derived(pgMaxWidthOn ? (parseMaxBound(pgMaxWidth) ?? undefined) : undefined)
  const maxHeight = $derived(pgMaxHeightOn ? (parseMaxBound(pgMaxHeight) ?? undefined) : undefined)

  // Drag deltas are fractional, so round to the nearest pixel for display.
  const sizeLabel = $derived(`${Math.round(pgWidth)} × ${Math.round(pgHeight)}`)
  const demoContentClass = $derived(pgContentClass || RESIZABLE_CONTENT)
  const childrenMarkup = $derived(buildResizableChildrenMarkup(demoContentClass))
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)

  // The size cells ride the live interaction state, so drags refresh them;
  // the seed reads the size from scope, so they carry no snippet sync. Empty
  // or non-numeric text keeps the current size.
  function applyWidthText(value: string): void {
    const parsed = Number(value)
    if (value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
      pgWidth = parsed
    }
  }

  function applyHeightText(value: string): void {
    const parsed = Number(value)
    if (value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
      pgHeight = parsed
    }
  }

  function clearPlayground(): void {
    pgMinWidth = '0'
    pgMinWidthOn = false
    pgMinHeight = '0'
    pgMinHeightOn = false
    pgMaxWidth = ''
    pgMaxWidthOn = false
    pgMaxHeight = ''
    pgMaxHeightOn = false
    pgContentClass = ''
    pgChildrenEnabled = true
    pgWidth = RESIZABLE_DEFAULT_WIDTH
    pgHeight = RESIZABLE_DEFAULT_HEIGHT
    pgClassName = ''
    pgClassNameOn = false
  }

  const code = $derived.by(() =>
    buildResizableSnippet({
      minWidth: pgMinWidth,
      minWidthOn: pgMinWidthOn,
      minHeight: pgMinHeight,
      minHeightOn: pgMinHeightOn,
      maxWidth: pgMaxWidth,
      maxWidthOn: pgMaxWidthOn,
      maxHeight: pgMaxHeight,
      maxHeightOn: pgMaxHeightOn,
      contentClass: pgContentClass,
      className: pgClassName,
      classNameOn: pgClassNameOn,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The bounds
  // emit as numeric expressions, so they sync as numbers; className emits only
  // when set, so it syncs as text; the live size rides scope through
  // script-locals, so the width/height cells carry no sync.
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'children',
      note: 'Content rendered inside the container; the size label reads live, so the dialog edits its class, and the eye resets to the default class.',
      value: childrenMarkup,
      onChange: (draft: string) => {
        const parsed = parseResizableChildrenMarkup(draft)
        if (parsed !== null) {
          pgContentClass = parsed === RESIZABLE_CONTENT ? '' : parsed
          pgChildrenEnabled = true
        }
      },
      dialog: snippetDialog(
        parseResizableChildrenMarkup,
        'Invalid content markup. Keep the single size-label <div> with its class.',
      ),
      toggle: resetToggle(
        pgChildrenEnabled,
        enabled => (pgChildrenEnabled = enabled),
        () => (pgContentClass = ''),
      ),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the container.', value: pgClassName, onChange: v => (pgClassName = v), editorDefaultValue: '', clearable: true, enabled: pgClassNameOn, setEnabled: v => (pgClassNameOn = v) }),
    { name: 'height', type: 'number', defaultValue: '—', note: 'Container height in pixels; drive it from onResize.', editor: 'number', value: String(pgHeight), onChange: applyHeightText }, // No eye: required live state driving onResize; omission would break the demo.
    { name: 'maxHeight', type: "number | 'parent'?", defaultValue: 'unbounded', note: "Upper clamp for the container height; 'parent' bounds it to the parent's content box.", editor: 'text', clearable: true, value: pgMaxHeight, onChange: value => { pgMaxHeight = value; pgMaxHeightOn = true; }, toggle: snippetToggle(pgMaxHeightOn, enabled => (pgMaxHeightOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('maxHeight')
      // Absent restores the default, like the builder omitting the line;
      // 'parent' and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return ''
      if (attr.kind === 'string' && attr.value === 'parent') return 'parent'
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'maxWidth', type: "number | 'parent'?", defaultValue: 'unbounded', note: "Upper clamp for the container width; 'parent' bounds it to the parent's content box.", editor: 'text', clearable: true, value: pgMaxWidth, onChange: value => { pgMaxWidth = value; pgMaxWidthOn = true; }, toggle: snippetToggle(pgMaxWidthOn, enabled => (pgMaxWidthOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('maxWidth')
      // Absent restores the default, like the builder omitting the line;
      // 'parent' and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return ''
      if (attr.kind === 'string' && attr.value === 'parent') return 'parent'
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'minHeight', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Lower clamp for the container height.', editor: 'number', clearable: true, value: pgMinHeight, onChange: value => { pgMinHeight = value; pgMinHeightOn = true; }, placeholder: '0', toggle: snippetToggle(pgMinHeightOn, enabled => (pgMinHeightOn = enabled)), sync: { kind: 'number' } },
    { name: 'minWidth', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Lower clamp for the container width.', editor: 'number', clearable: true, value: pgMinWidth, onChange: value => { pgMinWidth = value; pgMinWidthOn = true; }, placeholder: '0', toggle: snippetToggle(pgMinWidthOn, enabled => (pgMinWidthOn = enabled)), sync: { kind: 'number' } },
    { name: 'width', type: 'number', defaultValue: '—', note: 'Container width in pixels; drive it from onResize.', editor: 'number', value: String(pgWidth), onChange: applyWidthText }, // No eye: required live state driving onResize; omission would break the demo.
    { name: 'onResize', type: '(width: number, height?: number) => void', defaultValue: '—', note: 'Fires while dragging and on arrow-key nudges (`height` is `undefined` in width-only mode).' },
  ])


  // The seed covers every override except the live size (the snippet reads it
  // from scope through script-locals), so only drags need a scope refresh;
  // everything else reseeds. The refresh preserves the editor text by
  // recompiling the draft.
  </script>

<ShowcasePage
    {fields}
    title="Resizable"
    {code}
    onReset={clearPlayground}
    scope={{
      initialWidth: pgWidth,
      initialHeight: pgHeight,
      contentLabel: sizeLabel,
    }}

    sync={{ tag: 'Resizable' }}
    scopeRefresh={() => [pgWidth, pgHeight]}
  >
    <div class={RESIZABLE_SCROLLPORT} tabindex="-1">
      <Resizable
        width={pgWidth}
        height={pgHeight}
        onResize={(nextWidth, nextHeight) => {
          pgWidth = nextWidth
          pgHeight = nextHeight
        }}
        {minWidth}
        {minHeight}
        {maxWidth}
        {maxHeight}
        className={demoClassName}>
        <div class={demoContentClass}>{sizeLabel}</div>
      </Resizable>
    </div>
  </ShowcasePage>
