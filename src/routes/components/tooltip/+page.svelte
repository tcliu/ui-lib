<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Tooltip from '$lib/components/Tooltip.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { applied, eye, eyeResetToggle, stage, staged } from '$showcase/playground/staged'
  import { enumField, textField, snippetField } from '$showcase/playground/snippet-field'
  import { buildTooltipSnippet } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `explicitTrigger` is interaction state fed through scope.
  let explicitTrigger = $state<HTMLButtonElement | null>(null)
  const INITIAL = {
    label: staged('Apply', true),
    align: staged('center'),
    className: staged(''),
  }
  let pg = $state(structuredClone(INITIAL))
  // The component requires children, so the eye resets to the default label
  // instead of omitting; committing re-applies.

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  const demoLabel = $derived(pg.label.value || i18n.t('common.apply'))
  const demoAlign = $derived((applied(pg.align) || undefined) as 'center' | 'left' | 'right' | undefined)
  const demoClass = $derived(applied(pg.className) || undefined)
  const applyLabel = $derived(i18n.t('common.apply'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() => buildTooltipSnippet({ label: pg.label, align: pg.align, className: pg.className }))

  
  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The children
  // are required, so the eye resets to the default label instead of omitting;
  // committing re-applies.
  const fields: SyncableFieldConfig[] = $derived([
    enumField({ name: 'align', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Horizontal alignment to the trigger.', options: alignOptions, placeholder: 'center', clearLabel: 'Clear align', ...eye(pg.align) }),
    snippetField({
      name: 'children',
      note: 'Tooltip text/content; the dialog edits its text, and the eye resets to the default label.',
      value: demoLabel,
      onChange: value => stage(pg.label, value === applyLabel ? '' : value),
      placeholder: 'Apply',
      toggle: eyeResetToggle(pg.label, () => (pg.label.value = 'Apply')),
      sync: { kind: 'script', attr: 'label', unsetAbsent: true, set: value => (pg.label.value = value) },
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the tooltip box.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
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
    scopeRefreshWhen={() => pg.label.value === ''}
  >
    <Button bind:buttonEl={explicitTrigger}>{demoLabel}</Button>
    <Tooltip trigger={explicitTrigger} align={demoAlign} className={demoClass}>{demoLabel}</Tooltip>
  </ShowcasePage>
