<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { extractComponentAttributes } from '$lib/showcase/snippet-attributes'
  import { buildButtonSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  // The label edits the demo content (which carries no functions, but stays
  // in the footer as demo data); `clicks` is interaction state.
  let pgClicks = $state(0)
  let pgVariant = $state('')
  let pgAccent = $state('')
  let pgSize = $state('')
  let pgDisabled = $state<TriState>('')
  let pgPending = $state<TriState>('')
  let pgIcon = $state('')
  let pgBadge = $state('')
  let pgLabel = $state('')
  let pgClassName = $state('')

  const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost']
  const accents = ['cyan', 'emerald', 'amber', 'violet', 'rose']
  const sizes = ['xs', 'sm', 'md', 'lg']
  const iconOptions = [{ value: 'yes', label: 'Check icon' }]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  const demoVariant = $derived(
    (pgVariant || undefined) as 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | undefined,
  )
  const demoAccent = $derived((pgAccent || undefined) as 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | undefined)
  const demoSize = $derived(parseSizeValue(pgSize))
  const disabled = $derived(flagOn(pgDisabled))
  const pending = $derived(flagOn(pgPending))
  const demoLabel = $derived(pgLabel || i18n.t('common.apply'))

  function clearPlayground() {
    pgClicks = 0
    pgVariant = ''
    pgAccent = ''
    pgSize = ''
    pgDisabled = ''
    pgPending = ''
    pgIcon = ''
    pgBadge = ''
    pgLabel = ''
    pgClassName = ''
  }

  const code = $derived.by(() =>
    buildButtonSnippet({
      variant: pgVariant,
      accent: pgAccent,
      size: pgSize,
      disabled: pgDisabled,
      pending: pgPending,
      icon: pgIcon,
      badge: pgBadge,
      className: pgClassName,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ clicks: pgClicks, label: demoLabel, checkIcon }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, bare flags, `{true}`/`{false}`, and the
  // `icon={checkIcon}` scope ref); custom expressions are left alone, and a
  // draft without a complete demo tag (a free-form experiment) touches
  // nothing. Absent means unset, matching what the builder omits. `syncSeed`
  // then holds the regenerated seed back so the editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'Button')
    if (!attrs) {
      return
    }
    const text = (name: string): string | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      return attr.kind === 'string' ? attr.value : undefined
    }
    const tri = (name: string): TriState | undefined => {
      if (!attrs.has(name)) {
        return ''
      }
      const attr = attrs.get(name)!
      if (attr.kind === 'bare') {
        return 'yes'
      }
      if (attr.kind === 'expression' && (attr.value === 'true' || attr.value === 'false')) {
        return attr.value === 'true' ? 'yes' : 'no'
      }
      return undefined
    }
    const applyText = (name: string, assign: (value: string) => void) => {
      const next = text(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    const applyTri = (name: string, assign: (value: TriState) => void) => {
      const next = tri(name)
      if (next !== undefined) {
        assign(next)
      }
    }
    applyText('variant', value => (pgVariant = value))
    applyText('accent', value => (pgAccent = value))
    applyText('size', value => (pgSize = value))
    applyText('badge', value => (pgBadge = value))
    applyText('className', value => (pgClassName = value))
    applyTri('disabled', value => (pgDisabled = value))
    applyTri('pending', value => (pgPending = value))
    // An `icon={checkIcon}` scope ref means set, like the builder emits;
    // any other shape (or absence) leaves the playground alone unless the
    // attribute is gone entirely.
    const icon = attrs.get('icon')
    if (!icon) {
      pgIcon = ''
    } else if (icon.kind === 'expression' && icon.value === 'checkIcon') {
      pgIcon = 'yes'
    }
    preview.syncSeed()
  }

  // The seed covers every override except the label (the snippet reads it
  // from scope), so only label edits need a scope refresh; everything else
  // reseeds. The refresh preserves the editor text by recompiling the draft.
  $effect(() => {
    demoLabel
    if (preview.live) preview.refresh()
  })

  // Editable rows first (primitives and plain data, A–Z), then the function
  // props (A–Z). Snippet rows keep no Value editor yet; the snippet playground
  // remains their customization surface.
  const props: PropRow[] = [
    { name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'cyan'", note: 'Tint for primary, outline, and badge.' },
    { name: 'ariaExpanded', type: 'boolean', defaultValue: '—', note: 'Disclosure state for popover triggers.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for icon-only buttons.' },
    { name: 'ariaPressed', type: 'boolean', defaultValue: '—', note: 'Toggle state for pressable buttons.' },
    { name: 'badge', type: 'string | number', defaultValue: '—', note: 'Count pill overhanging the top-right corner.' },
    { name: 'buttonEl', type: 'HTMLButtonElement | null', defaultValue: 'null', note: 'Bindable native button element.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Button label/content.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes appended to the button.' },
    { name: 'dataTip', type: 'string', defaultValue: '—', note: 'data-tip attribute for the host tooltip engine.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Native disabled + reduced opacity.' },
    { name: 'focusRing', type: 'boolean', defaultValue: 'true', note: 'Keyboard focus ring; disable only when focus stays visible another way.' },
    { name: 'icon', type: 'Snippet', defaultValue: '—', note: 'Leading icon; icon-only when no children.' },
    { name: 'iconClass', type: 'string', defaultValue: '—', note: 'Overrides the icon box class (defaults to the size geometry).' },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disabled state with a spinner slot.' },
    { name: 'preventFocusSteal', type: 'boolean', defaultValue: 'false', note: 'Keeps focus on the current element when clicked.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | number", defaultValue: "'md'", note: 'Control scale; numbers are icon-scale pixels interpolated between the steps.' },
    { name: 'tooltip', type: 'string', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip.' },
    { name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment.' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type.' },
    { name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'", defaultValue: "'secondary'", note: 'Visual treatment.' },
    { name: 'onClick', type: '(event: MouseEvent) => void', defaultValue: '—', note: 'Click handler.' },
    { name: 'onKeyDown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown handler.' },
  ]
</script>

{#snippet checkIcon()}
  <CheckIcon size="sm" />
{/snippet}

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
{/snippet}

{#snippet pageActions()}
  <Button
    variant="ghost"
    size="sm"
    icon={codeIcon}
    ariaLabel={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    ariaExpanded={preview.open}
    tooltip={preview.open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    onClick={() => preview.toggle()} />
{/snippet}

{#snippet propValue(row: PropRow)}
  {#if row.name === 'variant'}
    <SelectDropdown
      buttonLabel={pgVariant || 'Default'}
      activeValue={pgVariant}
      ariaLabel="variant value"
      options={variants.map(value => ({ value, label: value }))}
      onSelect={value => (pgVariant = value)}
      clearable
      clearLabel="Clear variant"
      onClear={() => (pgVariant = '')} />
  {:else if row.name === 'accent'}
    <SelectDropdown
      buttonLabel={pgAccent || 'Default'}
      activeValue={pgAccent}
      ariaLabel="accent value"
      options={accents.map(value => ({ value, label: value }))}
      onSelect={value => (pgAccent = value)}
      clearable
      clearLabel="Clear accent"
      onClear={() => (pgAccent = '')} />
  {:else if row.name === 'size'}
    <SelectDropdown
      buttonLabel={pgSize || 'Default'}
      activeValue={pgSize}
      ariaLabel="size value"
      options={sizes.map(value => ({ value, label: value }))}
      filterable
      allowCustomValue
      onSelect={value => (pgSize = value)}
      clearable
      clearLabel="Clear size"
      onClear={() => (pgSize = '')} />
  {:else if row.name === 'disabled'}
    <Checkbox
      checked={disabled ?? false}
      ariaLabel="disabled value"
      onChange={value => (pgDisabled = value ? 'yes' : 'no')} />
  {:else if row.name === 'pending'}
    <Checkbox
      checked={pending ?? false}
      ariaLabel="pending value"
      onChange={value => (pgPending = value ? 'yes' : 'no')} />
  {:else if row.name === 'icon'}
    <SelectDropdown
      buttonLabel={pgIcon ? 'Check icon' : 'Default'}
      activeValue={pgIcon}
      ariaLabel="icon value"
      options={iconOptions}
      onSelect={value => (pgIcon = value)}
      clearable
      clearLabel="Clear icon"
      onClear={() => (pgIcon = '')} />
  {:else if row.name === 'badge'}
    <TextInput bind:value={pgBadge} ariaLabel="badge value" placeholder="(none)" />
  {:else if row.name === 'className'}
    <TextInput bind:value={pgClassName} ariaLabel="className value" placeholder="(none)" />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the label
    below edits the demo content (demo data, like the menu item labels).
    Reset restores everything. -->
  <div class="flex flex-col gap-3">
    <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
      <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
    </Buttons>
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
      <FormField label="Label" htmlFor="pg-label">
        <TextInput
          id="pg-label"
          bind:value={pgLabel}
          placeholder={i18n.t('common.apply')}
          ariaLabel="Label" />
      </FormField>
    </div>
  </div>
{/snippet}

<ShowcasePage name="Button" props={propsSnippet} actions={pageActions}>
  <ShowcaseSection
    title="Button"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{ clicks: pgClicks, label: demoLabel, checkIcon }}>
    <Button
      variant={demoVariant}
      accent={demoAccent}
      size={demoSize}
      {disabled}
      {pending}
      icon={pgIcon ? checkIcon : undefined}
      badge={pgBadge || undefined}
      className={pgClassName || undefined}
      onClick={() => (pgClicks += 1)}>
      {demoLabel} ({pgClicks})
    </Button>
  </ShowcaseSection>
</ShowcasePage>
