<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let value = $state('')

  const codeDefault = `<FormField label="Default">
  <input type="text" bind:value />
</FormField>
<FormField label="Apply" htmlFor="form-field-demo">
  <input id="form-field-demo" type="text" />
</FormField>`

  const codeCustomized = `<FormField label="Reset" className="rounded-md border border-cyan-500/40 p-3">
  <input type="text" bind:value />
</FormField>`

  const props: PropRow[] = [
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible field label.' },
    { name: 'htmlFor', type: 'string', defaultValue: '—', note: 'Associates the label with a control id.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the field wrapper.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'The control(s) under the label.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="FormField" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')} code={codeDefault} scope={{ value }}>
    <FormField label={i18n.t('showcase.default')}>
      <input
        type="text"
        bind:value
        class="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus-visible:border-cyan-500" />
    </FormField>
    <FormField label={i18n.t('common.apply')} htmlFor="form-field-demo">
      <input
        id="form-field-demo"
        type="text"
        class="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus-visible:border-cyan-500" />
    </FormField>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')} code={codeCustomized} scope={{ value }}>
    <FormField label={i18n.t('common.reset')} className="rounded-md border border-cyan-500/40 p-3">
      <input
        type="text"
        bind:value
        class="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus-visible:border-cyan-500" />
    </FormField>
  </ShowcaseSection>
</ShowcasePage>
