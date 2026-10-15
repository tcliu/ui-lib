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
  const INITIAL = {
    text: '',
    textOn: false,
    position: 'inline',
    positionOn: false,
    textClass: 'text-slate-400',
    textClassOn: false,
    containerClass: '',
    containerClassOn: false,
    ariaLabel: '',
    ariaLabelOn: false,
    tooltip: '',
    tooltipOn: false,
    children: '',
    childrenOn: false,
    size: 'md',
    sizeOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoPosition = $derived(pg.positionOn ? ((pg.position || undefined) as 'inline' | 'top-right' | undefined) : undefined)
  const demoTextClass = $derived(pg.textClassOn && pg.textClass ? pg.textClass : undefined)
  const demoContainerClass = $derived(pg.containerClassOn && pg.containerClass ? pg.containerClass : undefined)
  const demoAriaLabel = $derived(pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined)
  const demoTooltip = $derived(pg.tooltipOn && pg.tooltip ? pg.tooltip : undefined)
  const demoText = $derived(pg.textOn && pg.text ? pg.text : 'Copy me')
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

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
      textOn: pg.textOn,
      copyPosition: pg.position,
      copyPositionOn: pg.positionOn,
      textClass: pg.textClass,
      textClassOn: pg.textClassOn,
      containerClass: pg.containerClass,
      containerClassOn: pg.containerClassOn,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      tooltip: pg.tooltip,
      tooltipOn: pg.tooltipOn,
      children: pg.childrenOn ? pg.children : '',
      size: pg.size,
      sizeOn: pg.sizeOn,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The text is
  // always emitted (falling back to the demo default), so the default literal
  // maps back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the copy button.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    snippetField({
      name: 'children',
      note: 'Renders instead of text when passed; committing applies it, and the dialog edits its text.',
      value: pg.children,
      onChange: value => {
        pg.children = value
        pg.childrenOn = true
      },
      toggle: snippetToggle(pg.childrenOn, enabled => (pg.childrenOn = enabled)),
      dialog: { docType: 'text' },
    }),
    textField({ name: 'containerClass', type: 'string?', defaultValue: "''", note: 'Extra classes for the wrapper.', value: pg.containerClass, onChange: v => (pg.containerClass = v), editorDefaultValue: '', clearable: true, enabled: pg.containerClassOn, setEnabled: v => (pg.containerClassOn = v) }),
    enumField({ name: 'copyPosition', type: "'inline' | 'top-right'", defaultValue: "'inline'", note: 'Copy button placement.', options: positionOptions, value: pg.position, onChange: v => (pg.position = v), placeholder: 'inline', clearLabel: 'Clear copy position', enabled: pg.positionOn, setEnabled: v => (pg.positionOn = v) }),
    sizeField({ note: 'Copy button scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'text', type: 'string?', defaultValue: '—', note: 'Text to render (or wrap children instead).', editor: 'text', clearable: true, value: pg.text, onChange: value => { pg.text = value; pg.textOn = true; }, toggle: snippetToggle(pg.textOn, enabled => (pg.textOn = enabled)), sync: { kind: 'text', unsetValues: ['Copy me'] } },
    textField({ name: 'textClass', type: 'string?', defaultValue: "'text-slate-400'", note: 'Classes for the rendered text.', value: pg.textClass, onChange: v => (pg.textClass = v), editorDefaultValue: 'text-slate-400', clearable: true, placeholder: 'text-slate-400', enabled: pg.textClassOn, setEnabled: v => (pg.textClassOn = v) }),
    textField({ name: 'tooltip', type: 'string?', defaultValue: 'locale', note: 'Tooltip for the copy button.', value: pg.tooltip, onChange: v => (pg.tooltip = v), clearable: true, enabled: pg.tooltipOn, setEnabled: v => (pg.tooltipOn = v) }),
  ])

</script>

{#snippet demoChildren()}
  <span>{pg.children}</span>
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
      children={pg.childrenOn && pg.children ? demoChildren : undefined} />
  </ShowcasePage>
