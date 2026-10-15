<script lang="ts">
  import Copyable from '$lib/components/Copyable.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, sizeField, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildCopyableSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every option starts at the component
  // default (the Value column shows it), so the cleared form applies no
  // overrides and Show-code omits the defaults. Clearing a Value unsets it;
  // Reset restores the defaults below. The children
  // text is applied only while its eye toggle is on.
  let pgText = $state('')
  let pgTextOn = $state(false)
  let pgPosition = $state('inline')
  let pgPositionOn = $state(false)
  let pgTextClass = $state('text-slate-400')
  let pgTextClassOn = $state(false)
  let pgContainerClass = $state('')
  let pgContainerClassOn = $state(false)
  let pgAriaLabel = $state('')
  let pgAriaLabelOn = $state(false)
  let pgTooltip = $state('')
  let pgTooltipOn = $state(false)
  let pgChildren = $state('')
  let pgChildrenOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)

  const demoPosition = $derived(pgPositionOn ? ((pgPosition || undefined) as 'inline' | 'top-right' | undefined) : undefined)
  const demoTextClass = $derived(pgTextClassOn && pgTextClass ? pgTextClass : undefined)
  const demoContainerClass = $derived(pgContainerClassOn && pgContainerClass ? pgContainerClass : undefined)
  const demoAriaLabel = $derived(pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined)
  const demoTooltip = $derived(pgTooltipOn && pgTooltip ? pgTooltip : undefined)
  const demoText = $derived(pgTextOn && pgText ? pgText : 'Copy me')
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)

  const positionOptions = [
    { value: 'inline', label: 'inline' },
    { value: 'top-right', label: 'top-right' },
  ]

  function clearPlayground() {
    pgText = ''
    pgTextOn = false
    pgPosition = 'inline'
    pgPositionOn = false
    pgTextClass = 'text-slate-400'
    pgTextClassOn = false
    pgContainerClass = ''
    pgContainerClassOn = false
    pgAriaLabel = ''
    pgAriaLabelOn = false
    pgTooltip = ''
    pgTooltipOn = false
    pgChildren = ''
    pgChildrenOn = false
    pgSize = 'md'
    pgSizeOn = false
  }

  const code = $derived.by(() =>
    buildCopyableSnippet({
      text: pgText,
      textOn: pgTextOn,
      copyPosition: pgPosition,
      copyPositionOn: pgPositionOn,
      textClass: pgTextClass,
      textClassOn: pgTextClassOn,
      containerClass: pgContainerClass,
      containerClassOn: pgContainerClassOn,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      tooltip: pgTooltip,
      tooltipOn: pgTooltipOn,
      children: pgChildrenOn ? pgChildren : '',
      size: pgSize,
      sizeOn: pgSizeOn,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The text is
  // always emitted (falling back to the demo default), so the default literal
  // maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the copy button.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    snippetField({
      name: 'children',
      note: 'Renders instead of text when passed; committing applies it, and the dialog edits its text.',
      value: pgChildren,
      onChange: value => {
        pgChildren = value
        pgChildrenOn = true
      },
      toggle: snippetToggle(pgChildrenOn, enabled => (pgChildrenOn = enabled)),
      dialog: { docType: 'text' },
    }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the wrapper.', value: pgContainerClass, onChange: v => (pgContainerClass = v), editorDefaultValue: '', clearable: true, enabled: pgContainerClassOn, setEnabled: v => (pgContainerClassOn = v) }),
    enumField({ name: 'copyPosition', type: "'inline' | 'top-right'", defaultValue: "'inline'", note: 'Copy button placement.', options: positionOptions, value: pgPosition, onChange: v => (pgPosition = v), placeholder: 'inline', clearLabel: 'Clear copy position', enabled: pgPositionOn, setEnabled: v => (pgPositionOn = v) }),
    sizeField({ note: 'Copy button scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    { name: 'text', type: 'string?', defaultValue: '—', note: 'Text to render (or wrap children instead).', editor: 'text', clearable: true, value: pgText, onChange: value => { pgText = value; pgTextOn = true; }, toggle: snippetToggle(pgTextOn, enabled => (pgTextOn = enabled)), sync: { kind: 'text', unsetValues: ['Copy me'] } },
    textField({ name: 'textClass', type: 'string?', defaultValue: "'text-slate-400'", note: 'Classes for the rendered text.', value: pgTextClass, onChange: v => (pgTextClass = v), editorDefaultValue: 'text-slate-400', clearable: true, placeholder: 'text-slate-400', enabled: pgTextClassOn, setEnabled: v => (pgTextClassOn = v) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: 'locale', note: 'Tooltip for the copy button.', value: pgTooltip, onChange: v => (pgTooltip = v), clearable: true, enabled: pgTooltipOn, setEnabled: v => (pgTooltipOn = v) }),
  ])


</script>

{#snippet demoChildren()}
  <span>{pgChildren}</span>
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
      size={demoSize}
      copyPosition={demoPosition}
      textClass={demoTextClass}
      containerClass={demoContainerClass}
      ariaLabel={demoAriaLabel}
      tooltip={demoTooltip}
      children={pgChildrenOn && pgChildren ? demoChildren : undefined} />
  </ShowcasePage>
