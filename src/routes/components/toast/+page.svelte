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
  const INITIAL = {
    open: false,
    actionTaken: '',
    message: 'Default',
    messageOn: true,
    type: 'info',
    typeOn: false,
    position: 'bottom-right',
    positionOn: false,
    size: 'md',
    sizeOn: false,
    action: '',
    closeLabel: '',
    closeLabelOn: false,
  }
  let pg = $state(structuredClone(INITIAL))

  const typeOptions = ['success', 'info', 'warning', 'error'].map(value => ({ value, label: value }))
  const positionOptions = ['top-right', 'top-center', 'bottom-right', 'bottom-center'].map(value => ({
    value,
    label: value,
  }))

  const demoType = $derived(pg.typeOn ? ((pg.type || undefined) as 'success' | 'info' | 'warning' | 'error' | undefined) : undefined)
  const demoPosition = $derived(
    pg.positionOn
      ? ((pg.position || undefined) as 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' | undefined)
      : undefined,
  )
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const demoMessage = $derived(pg.messageOn && pg.message ? pg.message : i18n.t('showcase.default'))
  const demoCloseLabel = $derived(pg.closeLabelOn && pg.closeLabel ? pg.closeLabel : i18n.t('common.close'))
  const demoAction = $derived(
    pg.action ? { label: pg.action, onClick: () => (pg.actionTaken = pg.action) } : undefined,
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildToastSnippet({
      message: pg.message,
      messageOn: pg.messageOn,
      toastType: pg.type,
      toastTypeOn: pg.typeOn,
      position: pg.position,
      positionOn: pg.positionOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      action: pg.action,
      closeLabel: pg.closeLabel,
      closeLabelOn: pg.closeLabelOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the dismiss button.', value: pg.closeLabel, onChange: v => (pg.closeLabel = v), clearable: true, enabled: pg.closeLabelOn, setEnabled: v => (pg.closeLabelOn = v) }),
    { name: 'message', type: 'string', defaultValue: '—', note: 'Toast body text.', editor: 'text', clearable: true, value: pg.message, onChange: value => { pg.message = value; pg.messageOn = true; }, toggle: snippetToggle(pg.messageOn, enabled => (pg.messageOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultMessage' } },
    enumField({ name: 'position', type: "'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'", defaultValue: "'bottom-right'", note: 'Viewport edge the toast docks to.', options: positionOptions, value: pg.position, onChange: v => (pg.position = v), placeholder: 'bottom-right', clearLabel: 'Clear position', enabled: pg.positionOn, setEnabled: v => (pg.positionOn = v) }),
    sizeField({ note: 'Text scale; every metric is a fixed ratio of the size.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    enumField({ name: 'type', type: "'success' | 'info' | 'warning' | 'error'", defaultValue: "'info'", note: 'Accent treatment.', options: typeOptions, value: pg.type, onChange: v => (pg.type = v), placeholder: 'info', clearLabel: 'Clear type', enabled: pg.typeOn, setEnabled: v => (pg.typeOn = v) }),
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
      <TextInput bind:value={pg.action} ariaLabel="Action" />
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
      open: pg.open,
      actionTaken: pg.actionTaken,
      actionLabel: pg.action,
      defaultMessage: i18n.t('showcase.default'),
      closeLabel: i18n.t('common.close'),
      showLabel: i18n.t('showcase.openDialog'),
    }}

    sync={{ tag: 'Toast' }}
    scopeRefresh={() => [demoMessage]}
    scopeRefreshWhen={() => !(pg.messageOn && pg.message)}
  >
    <Button variant="primary" onClick={() => (pg.open = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if pg.open}
      <Toast
        message={demoMessage}
        closeLabel={demoCloseLabel}
        type={demoType}
        position={demoPosition}
        size={demoSize}
        action={demoAction}
        onClose={() => (pg.open = false)} />
    {/if}
    <span class="text-sm text-slate-400">action: {pg.actionTaken || '—'}</span>
  </ShowcasePage>
