<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { textField, sizeField, snippetToggle } from '$lib/showcase/snippet-field'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { DEFAULT_TEXT, buildCopyButtonSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  let pgText = $state('')
  let pgTextOn = $state(false)
  let pgAriaLabel = $state('')
  let pgAriaLabelOn = $state(false)
  let pgTooltip = $state('')
  let pgTooltipOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)

  const demoText = $derived(pgTextOn && pgText ? pgText : DEFAULT_TEXT)
  const copyHint = $derived(i18n.t('copy.toClipboard'))
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)

  function clearPlayground() {
    pgText = ''
    pgTextOn = false
    pgAriaLabel = ''
    pgAriaLabelOn = false
    pgTooltip = ''
    pgTooltipOn = false
    pgSize = 'md'
    pgSizeOn = false
  }

  const code = $derived.by(() =>
    buildCopyButtonSnippet({
      text: pgText,
      textOn: pgTextOn,
      ariaLabel: pgAriaLabel,
      ariaLabelOn: pgAriaLabelOn,
      tooltip: pgTooltip,
      tooltipOn: pgTooltipOn,
      size: pgSize,
      sizeOn: pgSizeOn,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The text is
  // always emitted (falling back to the default), so the default literal maps
  // back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the copy button.', value: pgAriaLabel, onChange: v => (pgAriaLabel = v), clearable: true, enabled: pgAriaLabelOn, setEnabled: v => (pgAriaLabelOn = v) }),
    sizeField({ note: 'Button scale; numbers are icon-scale pixels interpolated between the steps.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    { name: 'text', type: 'string', defaultValue: '—', note: 'Text placed on the clipboard (required).', editor: 'text', clearable: true, value: pgText, onChange: value => { pgText = value; pgTextOn = true; }, toggle: snippetToggle(pgTextOn, enabled => (pgTextOn = enabled)), sync: { kind: 'text', unsetValues: [DEFAULT_TEXT] } },
    textField({ name: 'tooltip', type: 'string?', defaultValue: 'locale', note: 'Tooltip shown on hover/focus.', value: pgTooltip, onChange: v => (pgTooltip = v), clearable: true, enabled: pgTooltipOn, setEnabled: v => (pgTooltipOn = v) }),
  ])


  // The hint reads the locale from scope, which reseeding never refreshes;
  // recompile the draft on those scope changes without touching the editor
  // text.
  </script>

<ShowcasePage
    {fields}
    title="CopyButton"
    {code}
    onReset={clearPlayground}
    scope={{ copyHint }}

    sync={{ tag: 'CopyButton' }}
    scopeRefresh={() => [copyHint]}
  >
    <div class="group flex flex-wrap items-center gap-3">
      <div class="flex max-w-full items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
        <span class="min-w-0 truncate font-mono text-sm text-slate-300">{demoText}</span>
        <CopyButton
          text={demoText}
          size={demoSize}
          ariaLabel={pgAriaLabelOn && pgAriaLabel ? pgAriaLabel : undefined}
          tooltip={pgTooltipOn && pgTooltip ? pgTooltip : undefined} />
      </div>
      <span class="text-xs text-slate-500">{copyHint}</span>
    </div>
  </ShowcasePage>
