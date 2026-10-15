<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { SnippetPreview } from '$lib/showcase/use-snippet-preview.svelte'
  import { useScopeRefresh } from '$lib/showcase/use-scope-refresh.svelte'
  import { syncFieldsOf, type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
  import {
    buildFormFieldChildrenMarkup,
    buildFormFieldSnippet,
    normalizeFormFieldChildrenDraft,
    parseFormFieldChildSegments,
    parseFormFieldChildrenMarkup,
    type FormFieldChildSegment,
  } from './demo-snippet'

  const i18n = getI18nContext()

  // Customizer playground state. Every curated option starts at the
  // component default (the Value column shows it), so the cleared form
  // applies no overrides and Show-code omits the defaults. Clearing a Value
  // unsets it; Reset restores the defaults below.
  // `pgValue` is interaction state fed through scope; the laid-out children are demo data
  // edited through the dialog below: raw markup while customized, empty for
  // the canonical TextInput. The eye toggle omits them from both the demo and
  // the seed when off.
  let pgValue = $state('')
  let pgLabel = $state('Default')
  let pgLabelOn = $state(true)
  let pgHtmlFor = $state('')
  let pgHtmlForOn = $state(false)
  let pgClassName = $state('')
  let pgClassNameOn = $state(false)
  let pgLayout = $state('stacked')
  let pgLayoutOn = $state(false)
  let pgChildren = $state('')
  let pgChildrenOn = $state(true)

  const layoutOptions = [{ value: 'inline', label: 'Inline' }]

  const demoLabel = $derived(pgLabelOn && pgLabel ? pgLabel : i18n.t('showcase.default'))
  const demoHtmlFor = $derived(pgHtmlForOn && pgHtmlFor ? pgHtmlFor : undefined)
  const demoClassName = $derived(pgClassNameOn && pgClassName ? pgClassName : undefined)
  const demoLayout = $derived(pgLayoutOn && pgLayout === 'inline' ? 'inline' : undefined)
  // Custom markup renders as committed; unset, the canonical TextInput reads
  // the dynamic id. Stored drafts are always valid, so the fallback only
  // covers the empty state.
  const demoChildren = $derived<FormFieldChildSegment[]>(
    parseFormFieldChildSegments(pgChildren || buildFormFieldChildrenMarkup({ htmlFor: pgHtmlForOn && pgHtmlFor ? pgHtmlFor : '' })) ?? [
      { kind: 'textinput', id: pgHtmlForOn && pgHtmlFor ? pgHtmlFor : '' },
    ],
  )
  // The children row edits the markup under the label (demo data, so it has
  // no single prop). Committing the canonical TextInput resets to unset, so
  // the id keeps flowing from the htmlFor row.
  const childrenSnippet = $derived(pgChildren || buildFormFieldChildrenMarkup({ htmlFor: pgHtmlForOn && pgHtmlFor ? pgHtmlFor : '' }))

  function clearPlayground() {
    pgValue = ''
    pgLabel = 'Default'
    pgLabelOn = true
    pgHtmlFor = ''
    pgHtmlForOn = false
    pgClassName = ''
    pgClassNameOn = false
    pgLayout = 'stacked'
    pgLayoutOn = false
    pgChildren = ''
    pgChildrenOn = true
  }

  const code = $derived.by(() =>
    buildFormFieldSnippet({
      label: pgLabel,
      labelOn: pgLabelOn,
      htmlFor: pgHtmlFor,
      htmlForOn: pgHtmlForOn,
      className: pgClassName,
      classNameOn: pgClassNameOn,
      layout: pgLayout,
      layoutOn: pgLayoutOn,
      children: pgChildren,
      childrenEnabled: pgChildrenOn,
    }),
  )

  const preview = new SnippetPreview({
    getSeed: () => code,
    getScope: () => ({ value: pgValue, defaultLabel: i18n.t('showcase.default') }),
    sync: { tag: 'FormField', getFields: () => syncFields },
  })

  // Each editable row declares its Value editor and its snippet write-back
  // shape once; the sync table below derives from the same declarations.
  // Snippet edits surface in the Value column, and `syncSeed` holds the
  // regenerated seed back so the editor keeps the user's text. The children
  // row commits any well-formed control/html mix verbatim; only markup the
  // static demo reproduces exactly is valid, so OK disables for anything
  // else.
  const fields: SyncableFieldConfig[] = $derived([
    snippetField({
      name: 'children',
      note: 'The control(s) under the label; TextInput lines and HTML elements, committing applies it.',
      value: childrenSnippet,
      onChange: (draft: string) => {
        if (!parseFormFieldChildrenMarkup(draft)) return
        const normalized = normalizeFormFieldChildrenDraft(draft)
        pgChildren = normalized === buildFormFieldChildrenMarkup({ htmlFor: pgHtmlForOn && pgHtmlFor ? pgHtmlFor : '' }) ? '' : normalized
        pgChildrenOn = true
      },
      dialog: snippetDialog(
        parseFormFieldChildrenMarkup,
        'Use <TextInput bind:value ... /> lines and well-formed HTML elements only — no {…} expressions, components, or event handlers.',
      ),
      toggle: snippetToggle(pgChildrenOn, enabled => (pgChildrenOn = enabled)),
    }),
    { name: 'className', type: 'string?', defaultValue: "''", editorDefaultValue: '', note: 'Extra classes for the field wrapper; the eye stages the customization.', editor: 'text', clearable: true, value: pgClassName, onChange: value => { pgClassName = value; pgClassNameOn = true; }, toggle: snippetToggle(pgClassNameOn, enabled => (pgClassNameOn = enabled)), sync: { kind: 'text' } },
    { name: 'htmlFor', type: 'string?', defaultValue: '—', note: 'Associates the label with a control id; the eye stages the customization.', editor: 'text', clearable: true, value: pgHtmlFor, onChange: value => { pgHtmlFor = value; pgHtmlForOn = true; }, toggle: snippetToggle(pgHtmlForOn, enabled => (pgHtmlForOn = enabled)), sync: { kind: 'text' } },
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible field label; the eye stages the customization.', editor: 'text', clearable: true, value: pgLabel, onChange: value => { pgLabel = value; pgLabelOn = true; }, toggle: snippetToggle(pgLabelOn, enabled => (pgLabelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    { name: 'layout', type: "'stacked' | 'inline'", defaultValue: "'stacked'", note: 'Stacked puts the label above the control; inline puts it in a 6rem column beside it; the eye stages the customization.', editor: 'enum', options: layoutOptions, value: pgLayout, onChange: value => { pgLayout = value; pgLayoutOn = true; }, placeholder: 'stacked', clearLabel: 'Clear layout', toggle: snippetToggle(pgLayoutOn, enabled => (pgLayoutOn = enabled)), sync: { kind: 'text' } },
  ])

  const syncFields = $derived(syncFieldsOf(fields))

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  useScopeRefresh(preview, () => [demoLabel], () => !(pgLabelOn && pgLabel))
</script>

<ShowcasePage
    {fields}
    title="FormField"
    {code}
    {preview}
    onReset={clearPlayground}
    scope={{ value: pgValue, defaultLabel: i18n.t('showcase.default') }}
>
    <FormField label={demoLabel} htmlFor={demoHtmlFor} className={demoClassName} layout={demoLayout}>
      {#if pgChildrenOn}
        {#each demoChildren as segment}
          {#if segment.kind === 'textinput'}
            <TextInput bind:value={pgValue} id={segment.id || undefined} />
          {:else}
            {@html segment.html}
          {/if}
        {/each}
      {/if}
    </FormField>
  </ShowcasePage>
