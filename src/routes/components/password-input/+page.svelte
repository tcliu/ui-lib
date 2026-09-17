<script lang="ts">
  import PasswordInput from '$lib/components/PasswordInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let value = $state('')
  let customValue = $state('')
  let disabledValue = $state('')

  const codeDefault = `<PasswordInput bind:value={value} placeholder="Password" />
<span class="text-sm text-slate-400">length: {value.length}</span>`

  const codeCustomized = `<PasswordInput bind:value={customValue} showLabel="Show secret" hideLabel="Hide secret" placeholder="Secret" />
<PasswordInput bind:value={disabledValue} disabled placeholder="Disabled" />`

  const props: PropRow[] = [
    { name: 'value', type: 'string', defaultValue: "''", note: 'Bindable field value.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'name', type: 'string', defaultValue: '—', note: 'Native input name.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Placeholder text.' },
    { name: 'autocomplete', type: 'string', defaultValue: "'current-password'", note: 'Native autocomplete token.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the field and the toggle.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', note: 'Native required flag.' },
    { name: 'showLabel', type: 'string', defaultValue: '—', note: 'Toggle label when hidden; falls back to the locale.' },
    { name: 'hideLabel', type: 'string', defaultValue: '—', note: 'Toggle label when visible; falls back to the locale.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the input.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Native input handler.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="PasswordInput" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')} code={codeDefault} scope={{ value }}>
    <PasswordInput bind:value={value} placeholder="Password" />
    <span class="text-sm text-slate-400">length: {value.length}</span>
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.customized')}
    code={codeCustomized}
    scope={{ customValue, disabledValue }}>
    <PasswordInput bind:value={customValue} showLabel="Show secret" hideLabel="Hide secret" placeholder="Secret" />
    <PasswordInput bind:value={disabledValue} disabled placeholder="Disabled" />
  </ShowcaseSection>
</ShowcasePage>
