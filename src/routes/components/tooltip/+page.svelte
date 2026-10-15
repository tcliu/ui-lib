<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Tooltip from '$lib/components/Tooltip.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, resetToggle, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildTooltipSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `explicitTrigger` is interaction state fed through scope.
  let explicitTrigger = $state<HTMLButtonElement | null>(null)
  const INITIAL = {
    label: 'Apply',
    childrenEnabled: true,
    align: 'center',
    alignOn: false,
    class: '',
    classOn: false,
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires children, so the eye resets to the default label
  // instead of omitting; committing re-applies.

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  const demoLabel = $derived(pg.label || i18n.t('common.apply'))
  const demoAlign = $derived(pg.alignOn ? ((pg.align || undefined) as 'center' | 'left' | 'right' | undefined) : undefined)
  const demoClass = $derived(pg.classOn && pg.class ? pg.class : undefined)
  const applyLabel = $derived(i18n.t('common.apply'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() => buildTooltipSnippet({ label: pg.label, align: pg.align, alignOn: pg.alignOn, className: pg.class, classNameOn: pg.classOn }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The children
  // are required, so the eye resets to the default label instead of omitting;
  // committing re-applies.
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Horizontal alignment to the trigger.', options: alignOptions, value: pg.align, onChange: v => (pg.align = v), placeholder: 'center', clearLabel: 'Clear align', enabled: pg.alignOn, setEnabled: v => (pg.alignOn = v) }),
    snippetField({
      name: 'children',
      note: 'Tooltip text/content; the dialog edits its text, and the eye resets to the default label.',
      value: demoLabel,
      onChange: value => {
        pg.label = value === applyLabel ? '' : value
        pg.childrenEnabled = true
      },
      placeholder: 'Apply',
      toggle: resetToggle(pg.childrenEnabled, enabled => (pg.childrenEnabled = enabled), () => (pg.label = 'Apply')),
      sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => (pg.label = value) },
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the tooltip box.', value: pg.class, onChange: v => (pg.class = v), editorDefaultValue: '', clearable: true, enabled: pg.classOn, setEnabled: v => (pg.classOn = v) }),
    { name: 'trigger', type: 'HTMLElement | null', defaultValue: 'null', note: 'Explicit trigger; falls back to the anchor parent.' },
  ])

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  </script>

<ShowcasePage
    {fields}
    title="Tooltip"
    {code}
    onReset={clearPlayground}
    scope={{ explicitTrigger, applyLabel }}

    sync={{ tag: 'Tooltip' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => pg.label === ''}
  >
    <Button bind:buttonEl={explicitTrigger}>{demoLabel}</Button>
    <Tooltip trigger={explicitTrigger} align={demoAlign} className={demoClass}>{demoLabel}</Tooltip>
  </ShowcasePage>
