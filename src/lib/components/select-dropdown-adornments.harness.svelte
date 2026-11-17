<script lang="ts">
  import SelectDropdown from './SelectDropdown.svelte'

  interface Props {
    filterable?: boolean
    leadingText?: string
    trailerText?: string
  }

  let { filterable = false, leadingText = 'Lead', trailerText = 'Trail' }: Props = $props()

  const options = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ]
  let value = $state('one')
</script>

<SelectDropdown
  activeValue={value}
  ariaLabel="adornments"
  {filterable}
  {options}
  onSelect={next => (value = next)}>
  {#snippet leading()}
    <span data-adornment="leading">{leadingText}</span>
  {/snippet}
  {#snippet trailer()}
    <span data-adornment="trailer">{trailerText}</span>
  {/snippet}
</SelectDropdown>
