<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import DataGrid from '$lib/components/DataGrid.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import SelectDropdown from '$lib/components/SelectDropdown.svelte'
  import ResetIcon from '$lib/icons/ResetIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'
  import ShowcaseStage from '$lib/showcase/ShowcaseStage.svelte'
  import { STAGE_RESIZE_DEFAULT } from '$lib/showcase/resizable-stage'
  import { DEMO_VALUE, buildDataGridSnippet, type TriState } from './demo-snippet'

  const i18n = getI18nContext()
  const stageResizeLabel = i18n.t('showcase.resizeDemo')

  // Fresh copy behind a helper: assigning a shared array inline would let an
  // edit in the demo mutate DEMO_VALUE for every later mount.
  function freshValue(): string[][] {
    return DEMO_VALUE.map(row => [...row])
  }

  // Customizer playground state. Every curated option starts unset (the
  // component default renders), so the cleared form applies no overrides.
  let pgValue = $state<string[][]>(freshValue())
  let pgEditable = $state<TriState>('')
  let pgShowHeaders = $state<TriState>('')
  let pgHideHeaderToggle = $state<TriState>('')
  // Stage width is interaction state, not a curated option, so it stays out of
  // isCustomized and Reset only restores it to the full-width default.
  let pgStageWidth = $state(STAGE_RESIZE_DEFAULT)

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  // Unset renders the component default; Yes/No force the value.
  function flagOn(value: TriState): boolean | undefined {
    return value === '' ? undefined : value === 'yes'
  }

  function triLabel(value: TriState): string {
    return value === '' ? 'Default' : value === 'yes' ? 'Yes' : 'No'
  }

  const editable = $derived(flagOn(pgEditable))
  const showHeaders = $derived(flagOn(pgShowHeaders))
  const hideHeaderToggle = $derived(flagOn(pgHideHeaderToggle))

  const isCustomized = $derived(
    pgEditable !== '' || pgShowHeaders !== '' || pgHideHeaderToggle !== ''
  )
  const sectionTitle = $derived(
    isCustomized ? i18n.t('showcase.customized') : i18n.t('showcase.default')
  )

  function clearPlayground() {
    pgValue = freshValue()
    pgEditable = ''
    pgShowHeaders = ''
    pgHideHeaderToggle = ''
    pgStageWidth = STAGE_RESIZE_DEFAULT
  }

  const code = $derived.by(() =>
    buildDataGridSnippet({
      editable: pgEditable,
      showHeaders: pgShowHeaders,
      hideHeaderToggle: pgHideHeaderToggle,
    })
  )

  const props: PropRow[] = [
    { name: 'value', type: 'string[][]', defaultValue: '[]', note: 'Cells as rows of strings; the first row is the header when showHeaders is on.' },
    { name: 'onChange', type: '(rows: string[][]) => void', defaultValue: '—', note: 'Called with the whole grid after every edit.' },
    { name: 'editable', type: 'boolean', defaultValue: 'true', note: 'Enables in-place cell editing and structure edits.' },
    { name: 'showHeaders', type: 'boolean', defaultValue: 'true', note: 'Treats the first row as a header (bindable).' },
    { name: 'testId', type: 'string', defaultValue: "'data-grid'", note: 'data-testid for the grid root.' },
    { name: 'maxColumns', type: 'number', defaultValue: '—', note: 'Locks the column count (e.g. key/value grids).' },
    { name: 'columnLabels', type: 'string[]', defaultValue: '—', note: 'Replaces column letters with display labels.' },
    { name: 'hideHeaderToggle', type: 'boolean', defaultValue: 'false', note: 'Hides the toolbar header toggle.' },
    { name: 'initialColumnWidths', type: 'string[]', defaultValue: '—', note: 'Initial widths as px numbers or percent strings.' },
    { name: 'storageKey', type: 'string', defaultValue: '—', note: 'Persists resized widths under this localStorage key.' },
  ]
</script>

{#snippet resetIcon()}
  <ResetIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

{#snippet settingsPanel()}
  <Buttons className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
    <Button size="sm" icon={resetIcon} onClick={clearPlayground}>
      Reset
    </Button>
  </Buttons>
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <FormField label="Editable">
      <SelectDropdown
        buttonLabel={triLabel(pgEditable)}
        activeValue={pgEditable}
        ariaLabel="Editable"
        options={yesNoOptions}
        onSelect={value => (pgEditable = value as TriState)}
        clearable
        clearLabel="Clear editable"
        onClear={() => (pgEditable = '')} />
    </FormField>
    <FormField label="Show headers">
      <SelectDropdown
        buttonLabel={triLabel(pgShowHeaders)}
        activeValue={pgShowHeaders}
        ariaLabel="Show headers"
        options={yesNoOptions}
        onSelect={value => (pgShowHeaders = value as TriState)}
        clearable
        clearLabel="Clear show headers"
        onClear={() => (pgShowHeaders = '')} />
    </FormField>
    <FormField label="Hide header toggle">
      <SelectDropdown
        buttonLabel={triLabel(pgHideHeaderToggle)}
        activeValue={pgHideHeaderToggle}
        ariaLabel="Hide header toggle"
        options={yesNoOptions}
        onSelect={value => (pgHideHeaderToggle = value as TriState)}
        clearable
        clearLabel="Clear hide header toggle"
        onClear={() => (pgHideHeaderToggle = '')} />
    </FormField>
  </div>
{/snippet}

<ShowcasePage name="DataGrid" props={propsSnippet} wide>
  <ShowcaseSection
    title={sectionTitle}
    code={code}
    footer={settingsPanel}
    scope={{ value: pgValue, resizeLabel: stageResizeLabel }}>
    <ShowcaseStage
      value={pgStageWidth}
      onChange={next => (pgStageWidth = next)}
      paneClass="h-72 w-full"
      resizeLabel={stageResizeLabel}>
      <DataGrid
        value={pgValue}
        onChange={next => (pgValue = next)}
        editable={editable}
        showHeaders={showHeaders}
        hideHeaderToggle={hideHeaderToggle} />
    </ShowcaseStage>
  </ShowcaseSection>
</ShowcasePage>
