<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$lib/showcase/size-input'
  import { type SyncableFieldConfig } from '$lib/showcase/snippet-sync'
  import { enumField, textField, sizeField, snippetDialog, snippetField, snippetToggle } from '$lib/showcase/snippet-field'
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
  const INITIAL = {
    value: '',
    label: 'Default',
    labelOn: true,
    htmlFor: '',
    htmlForOn: false,
    className: '',
    classNameOn: false,
    layout: 'stacked',
    layoutOn: false,
    size: 'md',
    sizeOn: false,
    children: '',
    childrenOn: true,
  }
  let pg = $state(structuredClone(INITIAL))

  const layoutOptions = [{ value: 'inline', label: 'Inline' }]

  const demoLabel = $derived(pg.labelOn && pg.label ? pg.label : i18n.t('showcase.default'))
  const demoHtmlFor = $derived(pg.htmlForOn && pg.htmlFor ? pg.htmlFor : undefined)
  const demoClassName = $derived(pg.classNameOn && pg.className ? pg.className : undefined)
  const demoLayout = $derived(pg.layoutOn && pg.layout === 'inline' ? 'inline' : undefined)
  const demoSize = $derived(pg.sizeOn ? parseSizeValue(pg.size) : undefined)
  // Custom markup renders as committed; unset, the canonical TextInput reads
  // the dynamic id. Stored drafts are always valid, so the fallback only
  // covers the empty state.
  const demoChildren = $derived<FormFieldChildSegment[]>(
    parseFormFieldChildSegments(pg.children || buildFormFieldChildrenMarkup({ htmlFor: pg.htmlForOn && pg.htmlFor ? pg.htmlFor : '' })) ?? [
      { kind: 'textinput', id: pg.htmlForOn && pg.htmlFor ? pg.htmlFor : '' },
    ],
  )
  // The children row edits the markup under the label (demo data, so it has
  // no single prop). Committing the canonical TextInput resets to unset, so
  // the id keeps flowing from the htmlFor row.
  const childrenSnippet = $derived(pg.children || buildFormFieldChildrenMarkup({ htmlFor: pg.htmlForOn && pg.htmlFor ? pg.htmlFor : '' }))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildFormFieldSnippet({
      label: pg.label,
      labelOn: pg.labelOn,
      htmlFor: pg.htmlFor,
      htmlForOn: pg.htmlForOn,
      className: pg.className,
      classNameOn: pg.classNameOn,
      layout: pg.layout,
      layoutOn: pg.layoutOn,
      size: pg.size,
      sizeOn: pg.sizeOn,
      children: pg.children,
      childrenEnabled: pg.childrenOn,
    }),
  )

  
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
        pg.children = normalized === buildFormFieldChildrenMarkup({ htmlFor: pg.htmlForOn && pg.htmlFor ? pg.htmlFor : '' }) ? '' : normalized
        pg.childrenOn = true
      },
      dialog: snippetDialog(
        parseFormFieldChildrenMarkup,
        'Use <TextInput bind:value ... /> lines and well-formed HTML elements only — no {…} expressions, components, or event handlers.',
      ),
      toggle: snippetToggle(pg.childrenOn, enabled => (pg.childrenOn = enabled)),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the field wrapper.', value: pg.className, onChange: v => (pg.className = v), editorDefaultValue: '', clearable: true, enabled: pg.classNameOn, setEnabled: v => (pg.classNameOn = v) }),
    textField({ name: 'htmlFor', type: 'string?', defaultValue: '—', note: 'Associates the label with a control id.', value: pg.htmlFor, onChange: v => (pg.htmlFor = v), clearable: true, enabled: pg.htmlForOn, setEnabled: v => (pg.htmlForOn = v) }),
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible field label.', editor: 'text', clearable: true, value: pg.label, onChange: value => { pg.label = value; pg.labelOn = true; }, toggle: snippetToggle(pg.labelOn, enabled => (pg.labelOn = enabled)), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    enumField({ name: 'layout', type: "'stacked' | 'inline'", defaultValue: "'stacked'", note: 'Stacked puts the label above the control; inline puts it in the size-scaled inline column beside it (6rem at md).', options: layoutOptions, value: pg.layout, onChange: v => (pg.layout = v), placeholder: 'stacked', clearLabel: 'Clear layout', enabled: pg.layoutOn, setEnabled: v => (pg.layoutOn = v) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Scales the label, gaps, and inline label column.', value: pg.size, onChange: v => (pg.size = v), enabled: pg.sizeOn, setEnabled: v => (pg.sizeOn = v) }),
  ])

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  </script>

<ShowcasePage
    {fields}
    title="FormField"
    {code}
    onReset={clearPlayground}
    scope={{ value: pg.value, defaultLabel: i18n.t('showcase.default') }}

    sync={{ tag: 'FormField' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => !(pg.labelOn && pg.label)}
  >
    <FormField label={demoLabel} htmlFor={demoHtmlFor} className={demoClassName} layout={demoLayout} size={demoSize}>
      {#if pg.childrenOn}
        {#each demoChildren as segment}
          {#if segment.kind === 'textinput'}
            <TextInput bind:value={pg.value} id={segment.id || undefined} />
          {:else}
            {@html segment.html}
          {/if}
        {/each}
      {/if}
    </FormField>
  </ShowcasePage>
