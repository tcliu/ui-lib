<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import Menu, { type MenuItemState } from '$lib/components/Menu.svelte'
  import Resizable from '$lib/components/Resizable.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import CodeIcon from '$lib/icons/CodeIcon.svelte'
  import KebabIcon from '$lib/icons/KebabIcon.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { extractComponentAttributes } from '$lib/showcase/snippet-attributes'
  import { splitLeadingScript } from '$lib/showcase/snippet-source'
  import {
    buildMenuSnippet,
    MENU_STAGE_CONTENT,
    MENU_STAGE_DEFAULT_WIDTH,
    MENU_STAGE_HOST,
    MENU_STAGE_MIN_WIDTH,
    MENU_STAGE_PANE,
    type TriState,
  } from './demo-snippet'

  const i18n = getI18nContext()

  interface DemoItem {
    id: string
    label: string
    disabled?: boolean
    onClick: () => void
  }

  // Customizer playground state. Every override starts unset (the component
  // default renders), so the cleared form applies no overrides; the chrome
  // classes seed to the demo's structural values. First/second labels edit the
  // demo items (which carry functions, so no JSON dialog fits).
  let pgAlign = $state('')
  let pgTriggerLabel = $state('')
  let pgFirstLabel = $state('')
  let pgSecondLabel = $state('')
  let pgAutoPlace = $state<TriState>('')
  let pgTriggerClass = $state('p-2')
  let pgPanelClass = $state('w-44')
  let pgLastAction = $state('')
  // Stage width is interaction state, not a curated option; Reset restores it.
  let pgStageWidth = $state(MENU_STAGE_DEFAULT_WIDTH)

  const alignOptions = [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
  ]

  const demoAlign = $derived((pgAlign || undefined) as 'left' | 'right' | undefined)
  const autoPlace = $derived(pgAutoPlace === '' ? undefined : pgAutoPlace === 'yes')
  const triggerLabel = $derived(pgTriggerLabel || i18n.t('kebab.label'))
  const firstLabel = $derived(pgFirstLabel || i18n.t('showcase.edit'))
  const secondLabel = $derived(pgSecondLabel || i18n.t('showcase.delete'))

  function menuItemClass(item: DemoItem, state: MenuItemState): string {
    return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition-none ${
      state.disabled ? 'cursor-not-allowed text-slate-600' : 'text-slate-300 focus:bg-slate-800 focus:text-cyan-200'
    }`
  }

  const demoItems = $derived<DemoItem[]>([
    { id: 'edit', label: firstLabel, onClick: () => (pgLastAction = firstLabel) },
    { id: 'delete', label: secondLabel, onClick: () => (pgLastAction = secondLabel) },
  ])

  function clearPlayground() {
    pgAlign = ''
    pgTriggerLabel = ''
    pgFirstLabel = ''
    pgSecondLabel = ''
    pgAutoPlace = ''
    pgTriggerClass = 'p-2'
    pgPanelClass = 'w-44'
    pgLastAction = ''
    pgStageWidth = MENU_STAGE_DEFAULT_WIDTH
  }

  const code = $derived.by(() =>
    buildMenuSnippet({
      align: pgAlign,
      triggerLabel: pgTriggerLabel,
      firstLabel: pgFirstLabel,
      secondLabel: pgSecondLabel,
      autoPlace: pgAutoPlace,
      triggerClass: pgTriggerClass,
      panelClass: pgPanelClass,
    }),
  )

  // The page owns the preview so its code toggle can sit in the component-title
  // row (ShowcasePage's `actions`) while the section renders the demo and the
  // editor below.
  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({
      menuItemClass,
      editLabel: i18n.t('showcase.edit'),
      deleteLabel: i18n.t('showcase.delete'),
      triggerLabel: i18n.t('kebab.label'),
      lastAction: pgLastAction,
    }),
    onCompiled: syncPlaygroundFromSnippet,
  })

  // Read a script-local menu-items label (`label: "..."` or a scope ref) back
  // out of snippet declarations. Returns undefined when the entry is absent or
  // unmodeled, so hand-written items the page did not author never sync.
  function extractMenuItemLabel(declarations: string, id: string, scopeRef: string): string | undefined {
    const match = new RegExp(`\\{\\s*id:\\s*'${id}',\\s*label:\\s*("(?:[^"\\\\]|\\\\.)*"|${scopeRef})`).exec(
      declarations,
    )
    if (!match) {
      return undefined
    }
    const raw = match[1]!
    if (raw === scopeRef) {
      return ''
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      return typeof parsed === 'string' ? parsed : undefined
    } catch {
      return undefined
    }
  }

  // Write a compiled snippet's recognized demo-tag attributes back into
  // playground state, so snippet edits show up in the Value column. Only
  // canonical shapes map (literals, bare flags, `{true}`/`{false}`); custom
  // expressions are left alone, and a draft without a complete demo tag (a
  // free-form experiment) touches nothing. Absent means unset, matching what
  // the builder omits. `syncSeed` then holds the regenerated seed back so the
  // editor keeps the user's text.
  function syncPlaygroundFromSnippet(source: string) {
    const attrs = extractComponentAttributes(source, 'Menu')
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
    // An `ariaLabel={triggerLabel}` scope ref means unset, like absence.
    const aria = attrs.get('ariaLabel')
    if (!aria || (aria.kind === 'expression' && aria.value === 'triggerLabel')) {
      pgTriggerLabel = ''
    } else if (aria.kind === 'string') {
      pgTriggerLabel = aria.value
    }
    applyText('align', value => (pgAlign = value))
    applyText('triggerClass', value => (pgTriggerClass = value))
    applyText('panelClass', value => (pgPanelClass = value))
    applyTri('autoPlace', value => (pgAutoPlace = value))
    const declarations = splitLeadingScript(source).declarations
    const first = extractMenuItemLabel(declarations, 'edit', 'editLabel')
    if (first !== undefined) {
      pgFirstLabel = first
    }
    const second = extractMenuItemLabel(declarations, 'delete', 'deleteLabel')
    if (second !== undefined) {
      pgSecondLabel = second
    }
    preview.syncSeed()
  }

  // Editable rows first (primitives, plain data, and snippets, A–Z), then the
  // function props (A–Z). Snippet rows keep no Value editor yet; the snippet
  // playground remains their customization surface.
  const props: PropRow[] = [
    { name: 'align', type: "'left' | 'right'", defaultValue: "'right'", note: 'Panel edge anchored to the trigger.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for the trigger.' },
    { name: 'autoPlace', type: 'boolean', defaultValue: 'true', note: 'Flips the panel when crowded.' },
    { name: 'icon', type: 'Snippet', defaultValue: '—', note: 'Trigger icon.' },
    { name: 'item', type: 'Snippet<[item, state]>', defaultValue: '—', note: 'Row renderer.' },
    { name: 'panelClass', type: 'string', defaultValue: "''", note: 'Extra classes for the floating panel.' },
    { name: 'triggerClass', type: 'string', defaultValue: "''", note: 'Extra classes for the trigger button.' },
    { name: 'itemClass', type: '(item, state) => string', defaultValue: '—', note: 'Row classes by state.' },
    { name: 'itemDisabled', type: '(item: T) => boolean', defaultValue: '() => false', note: 'Disables a row.' },
    { name: 'itemKey', type: '(item: T) => string', defaultValue: '—', note: 'Stable key per row.' },
    { name: 'items', type: 'T[]', defaultValue: '—', note: 'Row entries.' },
    { name: 'onSelect', type: '(index: number) => void', defaultValue: '—', note: 'Called with the picked row index.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon size="sm" />
{/snippet}

{#snippet codeIcon()}
  <CodeIcon size="sm" />
{/snippet}

{#snippet menuTriggerIcon()}
  <KebabIcon size="sm" />
{/snippet}

{#snippet menuRow(item: DemoItem, _state: MenuItemState)}
  {item.label}
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
  {#if row.name === 'ariaLabel'}
    <TextInput bind:value={pgTriggerLabel} ariaLabel="ariaLabel value" placeholder={i18n.t('kebab.label')} />
  {:else if row.name === 'align'}
    <SelectDropdown
      buttonLabel={pgAlign || 'right'}
      activeValue={pgAlign || 'right'}
      ariaLabel="align value"
      options={alignOptions}
      onSelect={value => (pgAlign = value)}
      clearable
      clearLabel="Clear align"
      onClear={() => (pgAlign = '')} />
  {:else if row.name === 'autoPlace'}
    <Checkbox
      checked={autoPlace ?? true}
      ariaLabel="autoPlace value"
      onChange={value => (pgAutoPlace = value ? 'yes' : 'no')} />
  {:else if row.name === 'triggerClass'}
    <TextInput bind:value={pgTriggerClass} ariaLabel="triggerClass value" placeholder="(none)" />
  {:else if row.name === 'panelClass'}
    <TextInput bind:value={pgPanelClass} ariaLabel="panelClass value" placeholder="(none)" />
  {:else}
    <span class="text-slate-500">—</span>
  {/if}
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} value={propValue} />
{/snippet}

{#snippet settingsPanel()}
  <!-- Single-prop editing lives in the props table's Value column; the item
    labels below edit the demo rows (which carry functions, so no JSON dialog
    fits). Reset restores everything. -->
  <div class="flex flex-col gap-3">
    <Buttons className="flex shrink-0 flex-wrap items-center gap-3">
      <Button size="sm" icon={resetIcon} onClick={clearPlayground}>Reset</Button>
    </Buttons>
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
      <FormField label="First item" htmlFor="pg-first">
        <TextInput
          id="pg-first"
          bind:value={pgFirstLabel}
          placeholder={i18n.t('showcase.edit')}
          ariaLabel="First item" />
      </FormField>
      <FormField label="Second item" htmlFor="pg-second">
        <TextInput
          id="pg-second"
          bind:value={pgSecondLabel}
          placeholder={i18n.t('showcase.delete')}
          ariaLabel="Second item" />
      </FormField>
    </div>
  </div>
{/snippet}

<ShowcasePage name="Menu" props={propsSnippet} actions={pageActions} wide>
  <ShowcaseSection
    title="Menu"
    {code}
    {preview}
    showHeader={false}
    bordered={false}
    footer={settingsPanel}
    scope={{
      menuItemClass,
      editLabel: i18n.t('showcase.edit'),
      deleteLabel: i18n.t('showcase.delete'),
      triggerLabel: i18n.t('kebab.label'),
      lastAction: pgLastAction,
    }}>
    <div class={MENU_STAGE_HOST}>
      <Resizable
        width={pgStageWidth}
        minWidth={MENU_STAGE_MIN_WIDTH}
        maxWidth="parent"
        onResize={nextWidth => (pgStageWidth = nextWidth)}>
        <div class={MENU_STAGE_PANE}>
          <div class={MENU_STAGE_CONTENT}>
            <Menu
              items={demoItems}
              itemKey={item => item.id}
              onSelect={index => demoItems[index].onClick()}
              icon={menuTriggerIcon}
              item={menuRow}
              ariaLabel={triggerLabel}
              align={demoAlign}
              {autoPlace}
              triggerClass={pgTriggerClass || undefined}
              panelClass={pgPanelClass || undefined}
              itemClass={menuItemClass}
              itemLabel={item => item.label}
              itemDisabled={item => item.disabled ?? false} />
            <span class="text-sm text-slate-400">last action: {pgLastAction || '—'}</span>
          </div>
        </div>
      </Resizable>
    </div>
  </ShowcaseSection>
</ShowcasePage>
