<script lang="ts">
  import Button from '#lib/components/Button.svelte'
  import FormField from '#lib/components/FormField.svelte'
  import SelectDropdown from '#lib/components/SelectDropdown.svelte'
  import TextInput from '#lib/components/TextInput.svelte'
  import Toast from '#lib/components/Toast.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import ShowcasePage from '#showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '#showcase/playground/snippet-sync.js'
  import { applied, eye, eyeToggle, stage, staged } from '#showcase/playground/staged.js'
  import { enumField, textField, sizeField } from '#showcase/playground/snippet-field.js'
  import { buildToastSnippet } from './demo-snippet'
  import { parseSizeValue } from '#showcase/playground/size-input.js'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgOpen` and `pgActionTaken` are interaction state, not curated options.
  const INITIAL = {
    open: false,
    actionTaken: '',
    message: staged('Default', true),
    type: staged('info'),
    position: staged('bottom-right'),
    size: staged('md'),
    action: '',
    closeLabel: staged(''),
    variant: staged('soft'),
  }
  let pg = $state(structuredClone(INITIAL))

  const typeOptions = ['success', 'info', 'warning', 'error'].map(value => ({ value, label: value }))
  const variantOptions = ['soft', 'solid', 'outline'].map(value => ({ value, label: value }))
  const sizeOptions = [
    { value: 'xs', label: 'xs' },
    { value: 'sm', label: 'sm' },
    { value: 'md', label: 'md' },
    { value: 'lg', label: 'lg' },
    { value: 'xl', label: 'xl' },
  ]
  const positionOptions = ['top-right', 'top-center', 'bottom-right', 'bottom-center'].map(value => ({
    value,
    label: value,
  }))

  const demoType = $derived((applied(pg.type) || undefined) as 'success' | 'info' | 'warning' | 'error' | undefined)
  const demoPosition = $derived(
    (applied(pg.position) || undefined) as 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' | undefined,
  )
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const demoVariant = $derived(
    (applied(pg.variant) || undefined) as 'soft' | 'solid' | 'outline' | undefined,
  )
  const demoMessage = $derived(applied(pg.message) || i18n.t('showcase.default'))
  const demoCloseLabel = $derived(applied(pg.closeLabel) || i18n.t('common.close'))
  const demoAction = $derived(
    pg.action ? { label: pg.action, onClick: () => (pg.actionTaken = pg.action) } : undefined,
  )

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildToastSnippet({
      message: pg.message,
      toastType: pg.type,
      position: pg.position,
      size: pg.size,
      action: pg.action,
      closeLabel: pg.closeLabel,
      variant: pg.variant,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'closeLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the dismiss button.', clearable: true, ...eye(pg.closeLabel) }),
    { name: 'message', type: 'string', defaultValue: '—', note: 'Toast body text.', editor: 'text', clearable: true, ...eye(pg.message), onChange: value => stage(pg.message, value), toggle: eyeToggle(pg.message), sync: { kind: 'scopeText', scopeRef: 'defaultMessage' } },
    enumField({ name: 'position', type: "'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'", defaultValue: "'bottom-right'", note: 'Viewport edge the toast docks to.', options: positionOptions, placeholder: 'bottom-right', clearLabel: 'Clear position', ...eye(pg.position) }),
    sizeField({ note: 'Text scale; every metric is a fixed ratio of the size.', ...eye(pg.size) }),
    enumField({ name: 'type', type: "'success' | 'info' | 'warning' | 'error'", defaultValue: "'info'", note: 'Accent treatment.', options: typeOptions, placeholder: 'info', clearLabel: 'Clear type', ...eye(pg.type) }),
    enumField({ name: 'variant', type: "'soft' | 'solid' | 'outline'", defaultValue: "'soft'", note: 'Presentation: tinted surface, filled with the type color, or a dark surface with a type-colored frame.', options: variantOptions, placeholder: 'soft', clearLabel: 'Clear variant', ...eye(pg.variant) }),
    { name: 'action', type: '{ label: string; onClick: () => void }?', defaultValue: '—', note: 'Action button; renders only when set.' },
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
    <FormField label="Size">
      <SelectDropdown
        activeValue={pg.size.value}
        ariaLabel="Size"
        options={sizeOptions}
        filterable
        allowCustomValue
        onSelect={value => stage(pg.size, value)}
        clearable
        clearLabel="Clear size"
        onClear={() => {
          pg.size.value = 'md'
          pg.size.on = false
        }} />
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
    scopeRefreshWhen={() => !applied(pg.message)}
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
        variant={demoVariant}
        onClose={() => (pg.open = false)} />
    {/if}
    <span class="text-sm text-slate-400">action: {pg.actionTaken || '—'}</span>
  </ShowcasePage>
