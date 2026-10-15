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
  const INITIAL = {
    text: '',
    textOn: false,
    ariaLabel: '',
    ariaLabelOn: false,
    tooltip: '',
    tooltipOn: false,
    size: 'md',
    sizeOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  const demoText = $derived(pg.textOn && pg.text ? pg.text : DEFAULT_TEXT)
  const copyHint = $derived(i18n.t('copy.toClipboard'))
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildCopyButtonSnippet({
      text: pg.text,
      textOn: pg.textOn,
      ariaLabel: pg.ariaLabel,
      ariaLabelOn: pg.ariaLabelOn,
      tooltip: pg.tooltip,
      tooltipOn: pg.tooltipOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
    }),
  )

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The text is
  // always emitted (falling back to the default), so the default literal maps
  // back to unset.
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'ariaLabel', type: 'string?', defaultValue: 'locale', note: 'Accessible name for the copy button.', value: pg.ariaLabel, onChange: v => (pg.ariaLabel = v), clearable: true, enabled: pg.ariaLabelOn, setEnabled: v => (pg.ariaLabelOn = v) }),
    sizeField({ note: 'Button scale; numbers are icon-scale pixels interpolated between the steps.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'text', type: 'string', defaultValue: '—', note: 'Text placed on the clipboard (required).', editor: 'text', clearable: true, value: pg.text, onChange: value => { pg.text = value; pg.textOn = true; }, toggle: snippetToggle(pg.textOn, enabled => (pg.textOn = enabled)), sync: { kind: 'text', unsetValues: [DEFAULT_TEXT] } },
    textField({ name: 'tooltip', type: 'string?', defaultValue: 'locale', note: 'Tooltip shown on hover/focus.', value: pg.tooltip, onChange: v => (pg.tooltip = v), clearable: true, enabled: pg.tooltipOn, setEnabled: v => (pg.tooltipOn = v) }),
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
          ariaLabel={pg.ariaLabelOn && pg.ariaLabel ? pg.ariaLabel : undefined}
          tooltip={pg.tooltipOn && pg.tooltip ? pg.tooltip : undefined} />
      </div>
      <span class="text-xs text-slate-500">{copyHint}</span>
    </div>
  </ShowcasePage>
