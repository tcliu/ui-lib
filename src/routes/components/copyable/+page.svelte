<script lang="ts">
  import Copyable from '#lib/components/Copyable.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { parseSizeValue } from '#showcase/playground/size-input.js'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { enumField, textField, sizeField, snippetField } from '#showcase/playground/snippet-field.js'
  import { applied, eye, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { buildCopyableSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below. The children
  // text is applied only while its eye toggle is on.
  const INITIAL = {
    text: staged(''),
    position: staged('inline'),
    textClass: staged('text-slate-400'),
    containerClass: staged(''),
    ariaLabel: staged(''),
    tooltip: staged(''),
    children: staged(''),
    copyText: staged(''),
    size: staged('md'),
  }
  let pg = $state(structuredClone(INITIAL))

  const demoPosition = $derived((applied(pg.position) || undefined) as 'inline' | 'top-right' | undefined)
  const demoTextClass = $derived(applied(pg.textClass) || undefined)
  const demoContainerClass = $derived(applied(pg.containerClass) || undefined)
  const demoAriaLabel = $derived(applied(pg.ariaLabel) || undefined)
  const demoTooltip = $derived(applied(pg.tooltip) || undefined)
  const demoText = $derived(applied(pg.text) || 'Copy me')
  const demoCopyText = $derived(applied(pg.copyText) || undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })

  const positionOptions = [
    { value: 'inline', label: 'inline' },
    { value: 'top-right', label: 'top-right' },
  ]

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildCopyableSnippet({
      text: pg.text,
      copyPosition: pg.position,
      textClass: pg.textClass,
      containerClass: pg.containerClass,
      ariaLabel: pg.ariaLabel,
      tooltip: pg.tooltip,
      children: pg.children,
      copyText: pg.copyText,
      size: pg.size,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The text is
  // always emitted (falling back to the demo default), so the default literal
  // maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the copy button.', clearable: true, ...eye(pg.ariaLabel) }),
    snippetField({
      name: 'children',
      note: 'Renders instead of text when passed; committing applies it, and the dialog edits its text.',
      value: pg.children.value,
      onChange: value => stage(pg.children, value),
      toggle: eyeToggle(pg.children),
      dialog: { docType: 'text' },
    }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the wrapper.', editorDefaultValue: '', clearable: true, ...eye(pg.containerClass) }),
    enumField({ name: 'copyPosition', type: "'inline' | 'top-right'", defaultValue: "'inline'", note: 'Copy button placement.', options: positionOptions, placeholder: 'inline', clearLabel: 'Clear copy position', ...eye(pg.position) }),
    textField({ name: 'copyText', type: 'string?', defaultValue: 'text', note: 'Value placed on the clipboard; defaults to text.', clearable: true, placeholder: 'text', ...eye(pg.copyText) }),
    sizeField({ note: 'Copy button scale; numbers are icon-scale pixels interpolated between the steps.', ...eye(pg.size) }),
    { name: 'text', type: 'string?', defaultValue: '—', note: 'Text to render (or wrap children instead).', editor: 'text', clearable: true, ...eye(pg.text), onChange: value => stage(pg.text, value), toggle: eyeToggle(pg.text), sync: { kind: 'text', unsetValues: ['Copy me'] } },
    textField({ name: 'textClass', type: 'string?', defaultValue: "'text-slate-400'", note: 'Classes for the rendered text.', editorDefaultValue: 'text-slate-400', clearable: true, placeholder: 'text-slate-400', ...eye(pg.textClass) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: 'locale', note: 'Tooltip for the copy button.', clearable: true, ...eye(pg.tooltip) }),
  ])

</script>

{#snippet demoChildren()}
  <span>{pg.children.value}</span>
{/snippet}

<ShowcasePage
    {fields}
    title="Copyable"
    {code}
    onReset={clearPlayground}

    sync={{ tag: 'Copyable' }}
    scope={{}}
  >
    <Copyable
      text={demoText}
      copyText={demoCopyText}
      size={demoSize}
      copyPosition={demoPosition}
      textClass={demoTextClass}
      containerClass={demoContainerClass}
      ariaLabel={demoAriaLabel}
      tooltip={demoTooltip}
      children={pg.children.on && pg.children.value ? demoChildren : undefined} />
  </ShowcasePage>
