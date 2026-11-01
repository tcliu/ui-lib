<script lang="ts">
  import EditableText from '$lib/components/EditableText.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import ShowcasePage from '$showcase/shell/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$showcase/playground/snippet-sync'
  import { applied, appliedFlag, eye, eyeFlag, eyeResetToggle, eyeToggle, stage, staged } from '$showcase/playground/staged'
  import { textField, boolField, sizeField } from '$showcase/playground/snippet-field'
  import { type TriState } from '$showcase/playground/snippet-build'
  import { DEFAULT_CLASS_NAME, DEFAULT_MAX_WIDTH, DEFAULT_TEXT, buildEditableTextSnippet } from './demo-snippet'
  import { parseSizeValue } from '$showcase/playground/size-input'

  const i18n = getI18nContext()

  // The committed value is demo state: double-clicking the label opens the
  // input and the accepted text is written back, so the demo stays controlled.
  const INITIAL = {
    value: staged(DEFAULT_TEXT, true),
    size: staged('md'),
    copyable: staged('no' as TriState),
    // Both are at the component default, so their eyes start off; the demo
    // renders the same and Show-code stays minimal.
    className: staged(DEFAULT_CLASS_NAME),
    maxWidth: staged(DEFAULT_MAX_WIDTH),
  }
  let pg = $state(structuredClone(INITIAL))

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.

  function asNumber(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  const copyable = $derived(appliedFlag(pg.copyable))
  const demoClassName = $derived(applied(pg.className) || undefined)
  const demoMaxWidth = $derived.by(() => {
    const value = applied(pg.maxWidth)
    return value === undefined ? undefined : asNumber(value)
  })
  const editHint = $derived(i18n.t('edit.doubleClickToEdit'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildEditableTextSnippet({
      value: pg.value,
      size: pg.size,
      copyable: pg.copyable,
      className: pg.className,
      maxWidth: pg.maxWidth,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'className', type: 'string?', defaultValue: "'text-slate-200'", note: 'Classes for the display label.', editorDefaultValue: 'text-slate-200', clearable: true, placeholder: 'text-slate-200', ...eye(pg.className) }),
    boolField({ name: 'copyable', defaultValue: 'false', note: 'Adds a copy button beside the label.', ...eyeFlag(pg.copyable) }),
    { name: 'maxWidth', type: 'number?', defaultValue: '480', editorDefaultValue: '480', note: 'Maximum input width in px; the field also stops at the viewport edge.', editor: 'number', clearable: true, ...eye(pg.maxWidth), onChange: value => stage(pg.maxWidth, value), placeholder: '480', toggle: eyeToggle(pg.maxWidth), sync: { kind: 'number' } },
    sizeField({ note: 'Text size for the label and the input.', ...eye(pg.size) }),
    { name: 'text', type: 'string', defaultValue: '—', note: 'Displayed value; double-click or use the edit button to change it (required); the eye resets to the default.', editor: 'text', clearable: true, ...eye(pg.value), onChange: value => stage(pg.value, value), toggle: eyeResetToggle(pg.value, () => (pg.value.value = DEFAULT_TEXT)), sync: { kind: 'script', attr: 'value' } },
    { name: 'onChange', type: '(text: string) => void | boolean', defaultValue: '—', note: 'Called with the committed value; return false to reject it and keep editing.' },
  ])

  // The hint reads the locale from scope, which reseeding never refreshes;
  // recompile the draft on those scope changes without touching the editor
  // text.
  </script>

<ShowcasePage
    {fields}
    title="EditableText"
    {code}
    onReset={clearPlayground}
    scope={{ editHint }}

    sync={{ tag: 'EditableText' }}
    scopeRefresh={() => [editHint]}
  >
    <div class="group flex flex-wrap items-center gap-2">
      <EditableText
        text={pg.value.value}
        onChange={next => {
          pg.value.value = next
        }}
        size={demoSize}
        {copyable}
        className={demoClassName}
        maxWidth={demoMaxWidth} />
      <span class="text-xs text-slate-500">{editHint}</span>
    </div>
  </ShowcasePage>
