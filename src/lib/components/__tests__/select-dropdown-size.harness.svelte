<script lang="ts">
  import SelectDropdown from '../SelectDropdown.svelte'

  const options = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ]

  let value = $state('one')
</script>

<SelectDropdown
  buttonLabel="Pick"
  activeValue={value}
  ariaLabel="custom size"
  size={14}
  {options}
  onSelect={next => (value = next)} />
