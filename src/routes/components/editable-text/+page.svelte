<script lang="ts">
  import { flagOn } from '$lib/showcase/snippet-build'
  import EditableText from '$lib/components/EditableText.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { textField, boolField, sizeField, snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { DEFAULT_TEXT, buildEditableTextSnippet, type TriState } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // The committed value is demo state: double-clicking the label opens the
  // input and the accepted text is written back, so the demo stays controlled.
  const INITIAL = {
    value: DEFAULT_TEXT,
    size: 'md',
    sizeOn: false,
    copyable: 'no' as TriState,
    copyableOn: false,
    valueOn: true,
    className: 'text-slate-200',
    classNameOn: true,
    maxWidth: '480',
    maxWidthOn: true,
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

  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  const copyable = $derived(pg.copyableOn ? flagOn(pg.copyable) : undefined)
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)
  const demoMaxWidth = $derived(pg.maxWidthOn ? asNumber(pg.maxWidth) : undefined)
  const editHint = $derived(i18n.t('edit.doubleClickToEdit'))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildEditableTextSnippet({
      value: pg.value,
      size: pg.size,
      sizeOn: pg.sizeOn,
      copyable: pg.copyable,
      copyableOn: pg.copyableOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      maxWidth: pg.maxWidth,
      maxWidthOn: pg.maxWidthOn,
    }),
  )

  
  const fields: SyncableFieldConfig[] = $derived([
    textField({ name: 'className', type: 'string?', defaultValue: "'text-slate-200'", note: 'Classes for the display label.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: 'text-slate-200', clearable: true, placeholder: 'text-slate-200', enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    boolField({ name: 'copyable', defaultValue: 'false', note: 'Adds a copy button beside the label.', value: pg.copyable, onChange: v => (pg.copyable = v as TriState), enabled: pg.copyableOn, setEnabled: v => (pg.copyableOn = v) }),
    { name: 'maxWidth', type: 'number?', defaultValue: '480', editorDefaultValue: '480', note: 'Maximum input width in px; the field also stops at the viewport edge.', editor: 'number', clearable: true, value: pg.maxWidth, onChange: value => { pg.maxWidth = value; pg.maxWidthOn = true; }, placeholder: '480', toggle: snippetToggle(pg.maxWidthOn, enabled => (pg.maxWidthOn = enabled)), sync: { kind: 'number' } },
    sizeField({ note: 'Text size for the label and the input.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
    { name: 'text', type: 'string', defaultValue: '—', note: 'Displayed value; double-click or use the edit button to change it (required); the eye resets to the default.', editor: 'text', clearable: true, value: pg.value, onChange: value => { pg.value = value; pg.valueOn = true; }, toggle: resetToggle(pg.valueOn, enabled => (pg.valueOn = enabled), () => (pg.value = DEFAULT_TEXT)), sync: { kind: 'script', attr: 'value' } },
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
        text={pg.value}
        onChange={next => {
          pg.value = next
        }}
        size={demoSize}
        {copyable}
        className={demoClassName}
        maxWidth={demoMaxWidth} />
      <span class="text-xs text-slate-500">{editHint}</span>
    </div>
  </ShowcasePage>
