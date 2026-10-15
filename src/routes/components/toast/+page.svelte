<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, sizeField, snippetToggle } from '$lib/showcase/snippet-field'
  import { buildToastSnippet } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen` and `pgActionTaken` are interaction state, not curated options.
  let pgOpen = $state(false)
  let pgActionTaken = $state('')
  let pgMessage = $state('Default')
  let pgMessageOn = $state(true)
  let pgType = $state('info')
  let pgTypeOn = $state(false)
  let pgPosition = $state('bottom-right')
  let pgPositionOn = $state(false)
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgAction = $state('')
  let pgCloseLabel = $state('')
  let pgCloseLabelOn = $state(false)

  const typeOptions = ['success', 'info', 'warning', 'error'].map(value => ({ value, label: value }))
  const positionOptions = ['top-right', 'top-center', 'bottom-right', 'bottom-center'].map(value => ({
    value,
    label: value,
  }))

  const demoType = $derived(pgTypeOn ? ((pgType || undefined) as 'success' | 'info' | 'warning' | 'error' | undefined) : undefined)
  const demoPosition = $derived(
    pgPositionOn
      ? ((pgPosition || undefined) as 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' | undefined)
      : undefined,
  )
  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const demoMessage = $derived(pgMessageOn && pgMessage ? pgMessage : i18n.t('showcase.default'))
  const demoCloseLabel = $derived(pgCloseLabelOn && pgCloseLabel ? pgCloseLabel : i18n.t('common.close'))
  const demoAction = $derived(
    pgAction ? { label: pgAction, onClick: () => (pgActionTaken = pgAction) } : undefined,
  )

  function clearPlayground() {
    pgOpen = false
    pgActionTaken = ''
    pgMessage = 'Default'
    pgMessageOn = true
    pgType = 'info'
    pgTypeOn = false
    pgPosition = 'bottom-right'
    pgPositionOn = false
    pgSize = 'md'
    pgSizeOn = false
    pgAction = ''
    pgCloseLabel = ''
    pgCloseLabelOn = false
  }

  const code = $derived.by(() =>
    buildToastSnippet({
      message: pgMessage,
      messageOn: pgMessageOn,
      toastType: pgType,
      toastTypeOn: pgTypeOn,
      position: pgPosition,
      positionOn: pgPositionOn,
      size: pgSize,
      sizeOn: pgSizeOn,
      action: pgAction,
      closeLabel: pgCloseLabel,
      closeLabelOn: pgCloseLabelOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the dismiss button.', value: pgCloseLabel, onChange: v => (pgCloseLabel = v), clearable: true, enabled: pgCloseLabelOn, setEnabled: v => (pgCloseLabelOn = v) }),
    { name: 'message', type: 'string', defaultValue: '—', note: 'Toast body text.', editor: 'text', clearable: true, value: pgMessage, onChange: value => { pgMessage = value; pgMessageOn = true; }, toggle: snippetToggle(pgMessageOn, enabled => (pgMessageOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultMessage' } },
    enumField({ name: 'position', type: "'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'", defaultValue: "'bottom-right'", note: 'Viewport edge the toast docks to.', options: positionOptions, value: pgPosition, onChange: v => (pgPosition = v), placeholder: 'bottom-right', clearLabel: 'Clear position', enabled: pgPositionOn, setEnabled: v => (pgPositionOn = v) }),
    sizeField({ note: 'Text scale; every metric is a fixed ratio of the size.', value: pgSize, onChange: v => (pgSize = v), enabled: pgSizeOn, setEnabled: v => (pgSizeOn = v) }),
    enumField({ name: 'type', type: "'success' | 'info' | 'warning' | 'error'", defaultValue: "'info'", note: 'Accent treatment.', options: typeOptions, value: pgType, onChange: v => (pgType = v), placeholder: 'info', clearLabel: 'Clear type', enabled: pgTypeOn, setEnabled: v => (pgTypeOn = v) }),
    { name: 'action', type: '{ label: string; onClick: () => void }', defaultValue: '—', note: 'Action button; renders only when set.' },
    { name: 'onClose', type: '() => void', defaultValue: '—', note: 'Dismiss handler (button and Escape).' },
  ])


  // With an unset message the demo reads the localized default from scope,
  // which reseeding never refreshes; recompile the draft on those scope
  // changes without touching the editor text. Customized messages ride the
  // seed instead.
  </script>

{#snippet settingsPanel()}
  <!-- The action is one object prop, so its label edits here instead of
    through a Value column. -->
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Action">
      <TextInput bind:value={pgAction} ariaLabel="Action" />
    </FormField>
  </div>
{/snippet}

<ShowcasePage
    {fields}
    title="Toast"
    {code}
    onReset={clearPlayground}
    configPanel={settingsPanel}
    scope={{
      open: pgOpen,
      actionTaken: pgActionTaken,
      actionLabel: pgAction,
      defaultMessage: i18n.t('showcase.default'),
      closeLabel: i18n.t('common.close'),
      showLabel: i18n.t('showcase.openDialog'),
    }}

    sync={{ tag: 'Toast' }}
    scopeRefresh={() => [demoMessage]}
    scopeRefreshWhen={() => !(pgMessageOn && pgMessage)}
  >
    <Button variant="primary" onClick={() => (pgOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pgOpen}
      <Toast
        message={demoMessage}
        closeLabel={demoCloseLabel}
        type={demoType}
        position={demoPosition}
        size={demoSize}
        action={demoAction}
        onClose={() => (pgOpen = false)} />
    {/if}
    <span class="text-sm text-slate-400">action: {pgActionTaken || '—'}</span>
  </ShowcasePage>
