<script lang="ts">
  import EditableText from '$lib/components/EditableText.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetToggle, resetToggle } from '$lib/showcase/snippet-field'
  import { DEFAULT_TEXT, buildEditableTextSnippet, type TriState } from './demo-snippet'
  import { parseSizeValue } from '$lib/showcase/size-input'

  const i18n = getI18nContext()

  // The committed value is demo state: double-clicking the label opens the
  // input and the accepted text is written back, so the demo stays controlled.
  let pgValue = $state(DEFAULT_TEXT)

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  let pgSize = $state('md')
  let pgSizeOn = $state(false)
  let pgCopyable = $state<TriState>('no')
  let pgCopyableOn = $state(false)
  let pgValueOn = $state(true)
  let pgClassName = $state('text-slate-200')
  let pgClassNameOn = $state(true)
  let pgMaxWidth = $state('480')
  let pgMaxWidthOn = $state(true)

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  function asNumber(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const demoSize = $derived(pgSizeOn ? parseSizeValue(pgSize) : undefined)
  const copyable = $derived(pgCopyableOn ? flagOn(pgCopyable) : undefined)
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)
  const demoMaxWidth = $derived(pgMaxWidthOn ? asNumber(pgMaxWidth) : undefined)
  const editHint = $derived(i18n.t('edit.doubleClickToEdit'))

  function clearPlayground() {
    pgValue = DEFAULT_TEXT
    pgValueOn = true
    pgSize = 'md'
    pgSizeOn = false
    pgCopyable = 'no'
    pgCopyableOn = false
    pgClassName = 'text-slate-200'
    pgClassNameOn = true
    pgMaxWidth = '480'
    pgMaxWidthOn = true
  }

  const code = $derived.by(() =>
    buildEditableTextSnippet({
      value: pgValue,
      size: pgSize,
      sizeOn: pgSizeOn,
      copyable: pgCopyable,
      copyableOn: pgCopyableOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      maxWidth: pgMaxWidth,
      maxWidthOn: pgMaxWidthOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ editHint }),
    sync: { tag: 'EditableText', getFields: () => syncFields },
  })

  const fields: SyncableFieldConfig[] = $derived([
    { name: 'className', type: 'string?', defaultValue: "'text-slate-200'", editorDefaultValue: 'text-slate-200', note: 'Classes for the display label; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, placeholder: 'text-slate-200', toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'copyable', type: 'boolean', defaultValue: 'false', note: 'Adds a copy button beside the label; the eye stages the customization.', editor: 'boolean', value: pgCopyable, onChange: value => { pgCopyable = value as TriState; pgCopyableOn = true; }, toggle: snippetToggle(pgCopyableOn, enabled => (pgCopyableOn = enabled)), sync: { kind: 'tri' } },
    { name: 'maxWidth', type: 'number?', defaultValue: '480', editorDefaultValue: '480', note: 'Maximum input width in px, clamped to the remaining horizontal space; the eye stages the customization.', editor: 'number', clearable: true, value: pgMaxWidth, onChange: value => { pgMaxWidth = value; pgMaxWidthOn = true; }, placeholder: '480', toggle: snippetToggle(pgMaxWidthOn, enabled => (pgMaxWidthOn = enabled)), sync: { kind: 'number' } },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", defaultValue: "'md'", note: 'Text size for the label and the input; the eye stages the customization.', editor: 'size', allowCustomValue: true, value: pgSize, onChange: value => { pgSize = value; pgSizeOn = true; }, clearLabel: 'Clear size', placeholder: 'md', toggle: snippetToggle(pgSizeOn, enabled => (pgSizeOn = enabled)), sync: { kind: 'custom', read: attrs => {
      const attr = attrs?.get('size')
      // Absent restores the default, like the builder omitting the line;
      // string and numeric shapes set, anything else is custom code the
      // playground leaves alone.
      if (!attr) return 'md'
      if (attr.kind === 'string') return attr.value
      if (attr.kind === 'expression' && /^\d+(\.\d+)?$/.test(attr.value)) return attr.value
      return undefined
    } } },
    { name: 'text', type: 'string', defaultValue: '—', note: 'Displayed value; double-click or use the edit button to change it (required); the eye resets to the default.', editor: 'text', clearable: true, value: pgValue, onChange: value => { pgValue = value; pgValueOn = true; }, toggle: resetToggle(pgValueOn, enabled => (pgValueOn = enabled), () => (pgValue = DEFAULT_TEXT)), sync: { kind: 'script', attr: 'value' } },
    { name: 'onChange', type: '(text: string) => void | boolean', defaultValue: '—', note: 'Called with the committed value; return false to reject it and keep editing.' },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // The hint reads the locale from scope, which reseeding never refreshes;
  // recompile the draft on those scope changes without touching the editor
  // text.
  useScopeRefresh(preview, () => [editHint])
</script>

<ShowcasePage
    {fields}
    title="EditableText"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ editHint }}
>
    <div class="group flex flex-wrap items-center gap-2">
      <EditableText
        text={pgValue}
        onChange={next => {
          pgValue = next
        }}
        size={demoSize}
        {copyable}
        className={demoClassName}
        maxWidth={demoMaxWidth} />
      <span class="text-xs text-slate-500">{editHint}</span>
    </div>
  </ShowcasePage>
