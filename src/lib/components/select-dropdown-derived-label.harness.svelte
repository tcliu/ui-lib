<script lang="ts">
  import SelectDropdown, { type SelectOption } from './SelectDropdown.svelte'

  interface HarnessProps {
    options?: SelectOption[]
    activeValue?: string
    buttonLabel?: string
  }

  let { options = ['one', 'two'], activeValue = 'two', buttonLabel }: HarnessProps = $props()
</script>

<SelectDropdown
  {buttonLabel}
  {activeValue}
  ariaLabel="test"
  {options}
  onSelect={() => {}} />
