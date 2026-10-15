<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle } from '$lib/showcase/snippet-field'
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

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      open: pgOpen,
      actionTaken: pgActionTaken,
      actionLabel: pgAction,
      defaultMessage: i18n.t('showcase.default'),
      closeLabel: i18n.t('common.close'),
      showLabel: i18n.t('showcase.openDialog'),
    }),
    sync: { tag: 'Toast', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    { name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the dismiss button; the eye stages the customization.', editor: 'text', clearable: true, value: pgCloseLabel, onChange: value => { pgCloseLabel = value; pgCloseLabelOn = true; }, toggle: snippetToggle(pgCloseLabelOn, enabled => (pgCloseLabelOn = enabled)), sync: { kind: 'text' } },
    { name: 'message', type: 'string', defaultValue: '—', note: 'Toast body text; the eye stages the customization.', editor: 'text', clearable: true, value: pgMessage, onChange: value => { pgMessage = value; pgMessageOn = true; }, toggle: snippetToggle(pgMessageOn, enabled => (pgMessageOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultMessage' } },
    { name: 'position', type: "'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'", defaultValue: "'bottom-right'", note: 'Viewport edge the toast docks to; the eye stages the customization.', editor: 'enum', options: positionOptions, value: pgPosition, onChange: value => { pgPosition = value; pgPositionOn = true; }, placeholder: 'bottom-right', clearLabel: 'Clear position', toggle: snippetToggle(pgPositionOn, enabled => (pgPositionOn = enabled)), sync: { kind: 'text' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Text scale; every metric is a fixed ratio of the size; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, placeholder: 'md', clearLabel: 'Clear size', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
      // Absent restores the default, like the builder omitting the line;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'type', type: "'success' | 'info' | 'warning' | 'error'", defaultValue: "'info'", note: 'Accent treatment; the eye stages the customization.', editor: 'enum', options: typeOptions, value: pgType, onChange: value => { pgType = value; pgTypeOn = true; }, placeholder: 'info', clearLabel: 'Clear type', toggle: snippetToggle(pgTypeOn, enabled => (pgTypeOn = enabled)), sync: { kind: 'text' } },
    { name: 'action', type: '{ label: string; onClick: () => void }', defaultValue: '—', note: 'Action button; renders only when set.' },
    { name: 'onClose', type: '() => void', defaultValue: '—', note: 'Dismiss handler (button and Escape).' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // With an unset message the demo reads the localized default from scope,
  // which reseeding never refreshes; recompile the draft on those scope
  // changes without touching the editor text. Customized messages ride the
  // seed instead.
  useScopeRefresh(preview, () => [demoMessage], () => !(pgMessageOn && pgMessage))
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
    {preview}
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
