<script lang="ts">
  import Checkbox from '$lib/components/Checkbox.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let basic = $state(true)
  let small = $state(false)
  let disabled = $state(true)
  let indeterminate = $state(false)
  let noLabel = $state(false)
  let lastChange = $state('—')
  let inputEl = $state<HTMLInputElement | null>(null)

  const codeDefault = `<Checkbox bind:checked={basic} label="Apply" />
<Checkbox bind:checked={basic} label="Default" name="demo" />
<Checkbox bind:checked={small} size="sm" label="Customized" />
<Checkbox bind:checked={disabled} disabled label="Default" />
<Checkbox bind:checked={indeterminate} indeterminate label="indeterminate" />
<Checkbox bind:checked={noLabel} ariaLabel="Close" />`

  const codeCustomized = `<Checkbox
  bind:checked={basic}
  label="OK"
  labelClass="text-cyan-300"
  wrapperClass="rounded-md border border-slate-700 px-3 py-2"
  boxClass="rounded-full" />
<Checkbox
  bind:checked={basic}
  label="Cancel"
  stopPropagation={false}
  onChange={checked => (lastChange = String(checked))} />
<Checkbox bind:checked={basic} bind:inputRef={inputEl} label="Reload" />`

  const codeState = `<p>lastChange: {lastChange}</p>
<p>inputRef: {inputEl ? inputEl.type : '—'}</p>`

  const props: PropRow[] = [
    { name: 'checked', type: 'boolean', defaultValue: '—', note: 'Bindable checked state.' },
    { name: 'label', type: 'string', defaultValue: '—', note: 'Visible label; also the accessible name.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name when no visible label.' },
    { name: 'name', type: 'string', defaultValue: '—', note: 'Native input name.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input.' },
    { name: 'indeterminate', type: 'boolean', defaultValue: 'false', note: 'Mixed state glyph.' },
    { name: 'stopPropagation', type: 'boolean', defaultValue: 'true', note: 'Stops the click bubbling to clickable rows.' },
    { name: 'size', type: "'sm' | 'md'", defaultValue: "'md'", note: 'Box and label size.' },
    { name: 'labelClass', type: 'string', defaultValue: '—', note: 'Extra classes for the label text.' },
    { name: 'wrapperClass', type: 'string', defaultValue: "''", note: 'Extra classes for the wrapping label.' },
    { name: 'boxClass', type: 'string', defaultValue: "''", note: 'Extra classes for the box span.' },
    { name: 'inputRef', type: 'HTMLInputElement | null', defaultValue: 'null', note: 'Bindable native input element.' },
    { name: 'onChange', type: '(checked: boolean) => void', defaultValue: '—', note: 'Called with the next checked value.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Checkbox" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')} code={codeDefault}>
    <Checkbox bind:checked={basic} label={i18n.t('common.apply')} />
    <Checkbox bind:checked={basic} label={i18n.t('showcase.default')} name="demo" />
    <Checkbox bind:checked={small} size="sm" label={i18n.t('showcase.customized')} />
    <Checkbox bind:checked={disabled} disabled label={i18n.t('showcase.default')} />
    <Checkbox bind:checked={indeterminate} indeterminate label="indeterminate" />
    <Checkbox bind:checked={noLabel} ariaLabel={i18n.t('common.close')} />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')} code={codeCustomized}>
    <Checkbox
      bind:checked={basic}
      label={i18n.t('common.ok')}
      labelClass="text-cyan-300"
      wrapperClass="rounded-md border border-slate-700 px-3 py-2"
      boxClass="rounded-full" />
    <Checkbox
      bind:checked={basic}
      label={i18n.t('common.cancel')}
      stopPropagation={false}
      onChange={checked => (lastChange = String(checked))} />
    <Checkbox bind:checked={basic} bind:inputRef={inputEl} label={i18n.t('common.reload')} />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.state')} code={codeState}>
    <p class="text-sm text-slate-400">lastChange: {lastChange}</p>
    <p class="text-sm text-slate-400">inputRef: {inputEl ? inputEl.type : '—'}</p>
  </ShowcaseSection>
</ShowcasePage>
