<script lang="ts">
  import AutoComplete from './AutoComplete.svelte'
  import type { SelectOption } from './SelectDropdown.svelte'

  const options: SelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
  ]

  let value = $state('')
  let picked = $state('')
</script>

<AutoComplete
  bind:value
  {options}
  ariaLabel="Country"
  onSelect={next => (picked = next)} />
<span data-testid="value">{value}</span>
<span data-testid="picked">{picked}</span>
