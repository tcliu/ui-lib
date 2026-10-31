<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import TextInput from '$lib/components/TextInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import ShowcasePage from '$showcase/ShowcasePage.svelte'
  import { parseSizeValue } from '$showcase/size-input'
  import { type SyncableFieldConfig } from '$showcase/snippet-sync'
  import { enumField, textField, sizeField, snippetDialog, snippetField } from '$showcase/snippet-field'
  import { applied, eye, eyeToggle, stage, staged } from '$showcase/staged'
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
    label: staged('Default', true),
    htmlFor: staged(''),
    className: staged(''),
    layout: staged('stacked'),
    size: staged('md'),
    // The laid-out children are demo data: the pair carries the committed
    // markup and its eye whether the snippet applies.
    children: staged('', true),
  }
  let pg = $state(structuredClone(INITIAL))

  const layoutOptions = [{ value: 'inline', label: 'Inline' }]

  const demoLabel = $derived(applied(pg.label) || i18n.t('showcase.default'))
  const demoHtmlFor = $derived(applied(pg.htmlFor) || undefined)
  // The canonical child's id follows the htmlFor row while it applies.
  const htmlForId = $derived(demoHtmlFor ?? '')
  const demoClassName = $derived(applied(pg.className) || undefined)
  const demoLayout = $derived(applied(pg.layout) === 'inline' ? 'inline' : undefined)
  const demoSize = $derived.by(() => {
    const value = applied(pg.size)
    return value === undefined ? undefined : parseSizeValue(value)
  })
  // Custom markup renders as committed; unset, the canonical TextInput reads
  // the dynamic id. Stored drafts are always valid, so the fallback only
  // covers the empty state.
  const demoChildren = $derived<FormFieldChildSegment[]>(
    parseFormFieldChildSegments(pg.children.value || buildFormFieldChildrenMarkup({ htmlFor: htmlForId })) ?? [
      { kind: 'textinput', id: htmlForId },
    ],
  )
  // The children row edits the markup under the label (demo data, so it has
  // no single prop). Committing the canonical TextInput resets to unset, so
  // the id keeps flowing from the htmlFor row.
  const childrenSnippet = $derived(pg.children.value || buildFormFieldChildrenMarkup({ htmlFor: htmlForId }))

  function clearPlayground() {
    pg = structuredClone(INITIAL)
  }

  const code = $derived.by(() =>
    buildFormFieldSnippet({
      label: pg.label,
      htmlFor: pg.htmlFor,
      className: pg.className,
      layout: pg.layout,
      size: pg.size,
      children: pg.children,
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
        stage(pg.children, normalized === buildFormFieldChildrenMarkup({ htmlFor: htmlForId }) ? '' : normalized)
      },
      dialog: snippetDialog(
        parseFormFieldChildrenMarkup,
        'Use <TextInput bind:value ... /> lines and well-formed HTML elements only — no {…} expressions, components, or event handlers.',
      ),
      toggle: eyeToggle(pg.children),
    }),
    textField({ name: 'className', type: 'string?', defaultValue: "''", note: 'Extra classes for the field wrapper.', editorDefaultValue: '', clearable: true, ...eye(pg.className) }),
    textField({ name: 'htmlFor', type: 'string?', defaultValue: '—', note: 'Associates the label with a control id.', clearable: true, ...eye(pg.htmlFor) }),
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible field label.', editor: 'text', clearable: true, ...eye(pg.label), onChange: value => stage(pg.label, value), toggle: eyeToggle(pg.label), sync: { kind: 'scopeText', scopeRef: 'defaultLabel' } },
    enumField({ name: 'layout', type: "'stacked' | 'inline'", defaultValue: "'stacked'", note: 'Stacked puts the label above the control; inline puts it in the size-scaled inline column beside it (6rem at md).', options: layoutOptions, placeholder: 'stacked', clearLabel: 'Clear layout', ...eye(pg.layout) }),
    sizeField({ note: 'Control scale; numbers are icon-scale pixels. Scales the label, gaps, and inline label column.', ...eye(pg.size) }),
  ])

  // With an unset label the demo reads the localized default from scope, which
  // reseeding never refreshes; recompile the draft on those scope changes
  // without touching the editor text. Customized labels ride the seed instead.
  </script>

{#snippet fieldChildren()}
  {#each demoChildren as segment}
    {#if segment.kind === 'textinput'}
      <TextInput bind:value={pg.value} id={segment.id || undefined} />
    {:else}
      {@html segment.html}
    {/if}
  {/each}
{/snippet}

<ShowcasePage
    {fields}
    title="FormField"
    {code}
    onReset={clearPlayground}
    scope={{ value: pg.value, defaultLabel: i18n.t('showcase.default') }}

    sync={{ tag: 'FormField' }}
    scopeRefresh={() => [demoLabel]}
    scopeRefreshWhen={() => !applied(pg.label)}
  >
    <FormField
      label={demoLabel}
      htmlFor={demoHtmlFor}
      className={demoClassName}
      layout={demoLayout}
      size={demoSize}
      children={pg.children.on ? fieldChildren : undefined} />
  </ShowcasePage>
