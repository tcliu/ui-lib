<script lang="ts">
  import SelectDropdown from './SelectDropdown.svelte'

  interface Option {
    value: string
    label: string
  }

  const options: Option[] = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Three' },
  ]

  let value = $state('two')
  const buttonLabel = $derived(options.find(option => option.value === value)?.label ?? '')
</script>

<SelectDropdown
  {buttonLabel}
  activeValue={value}
  ariaLabel="test"
  filterable
  emptyLabel="No results"
  {options}
  onSelect={next => (value = next)} />
