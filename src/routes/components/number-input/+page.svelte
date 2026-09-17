<script lang="ts">
  import NumberInput from '$lib/components/NumberInput.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let value = $state('5')
  let decimal = $state('1.5')
  let empty = $state('')
  let disabled = $state('3')
  let stepless = $state('10')
  let custom = $state('20')
  let keydowns = $state(0)
  let inputs = $state(0)
  let blurs = $state(0)

  const codeDefault = `<NumberInput bind:value ariaLabel="default" />
<NumberInput bind:value={decimal} min={0} max={10} step={0.5} ariaLabel="decimal" />
<NumberInput bind:value={empty} placeholder="0" ariaLabel="placeholder" />`

  const codeCustomized = `<NumberInput bind:value={disabled} disabled ariaLabel="disabled" />
<NumberInput bind:value={stepless} showControls={false} className="w-24" ariaLabel="no controls" />
<NumberInput
  bind:value={custom}
  id="number-input-demo"
  incrementLabel="Add one"
  decrementLabel="Remove one"
  ariaLabel="custom labels" />
<NumberInput
  bind:value={value}
  ariaLabel="events"
  onkeydown={() => (keydowns += 1)}
  oninput={() => (inputs += 1)}
  onblur={() => (blurs += 1)} />`

  const codeEvents = `<p>keydown: {keydowns}, input: {inputs}, blur: {blurs}</p>`

  const props: PropRow[] = [
    { name: 'value', type: 'string', defaultValue: '—', note: 'Bindable field value.' },
    { name: 'min', type: 'number', defaultValue: '—', note: 'Lower clamp on blur and step.' },
    { name: 'max', type: 'number', defaultValue: '—', note: 'Upper clamp on blur and step.' },
    { name: 'step', type: 'number', defaultValue: '1', note: 'Arrow/wheel step; decimals preserved.' },
    { name: 'placeholder', type: 'string', defaultValue: '—', note: 'Native placeholder.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Disables the input and steppers.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the input.' },
    { name: 'showControls', type: 'boolean', defaultValue: 'true', note: 'Renders the stepper buttons.' },
    { name: 'id', type: 'string', defaultValue: '—', note: 'Native input id.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Required accessible name.' },
    { name: 'incrementLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the up button.' },
    { name: 'decrementLabel', type: 'string', defaultValue: 'locale', note: 'Accessible name for the down button.' },
    { name: 'onkeydown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown callback.' },
    { name: 'oninput', type: '(event: Event) => void', defaultValue: '—', note: 'Input callback.' },
    { name: 'onblur', type: '(event: FocusEvent) => void', defaultValue: '—', note: 'Blur callback.' },
  ]
</script>

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="NumberInput" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')} code={codeDefault}>
    <div class="flex flex-col gap-1">
      <NumberInput bind:value ariaLabel="default" />
      <span class="text-sm text-slate-400">value: {value}</span>
    </div>
    <div class="flex flex-col gap-1">
      <NumberInput bind:value={decimal} min={0} max={10} step={0.5} ariaLabel="decimal" />
      <span class="text-sm text-slate-400">value: {decimal}</span>
    </div>
    <NumberInput bind:value={empty} placeholder="0" ariaLabel="placeholder" />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')} code={codeCustomized}>
    <NumberInput bind:value={disabled} disabled ariaLabel="disabled" />
    <NumberInput bind:value={stepless} showControls={false} className="w-24" ariaLabel="no controls" />
    <NumberInput
      bind:value={custom}
      id="number-input-demo"
      incrementLabel="Add one"
      decrementLabel="Remove one"
      ariaLabel="custom labels" />
    <NumberInput
      bind:value={value}
      ariaLabel="events"
      onkeydown={() => (keydowns += 1)}
      oninput={() => (inputs += 1)}
      onblur={() => (blurs += 1)} />
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.events')} code={codeEvents}>
    <p class="text-sm text-slate-400">keydown: {keydowns}, input: {inputs}, blur: {blurs}</p>
  </ShowcaseSection>
</ShowcasePage>
