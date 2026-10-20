<script lang="ts">
  import DateInput from '../DateInput.svelte'

  let { time = false }: { time?: boolean } = $props()

  // A controlled parent: the field's commits write back into `value`, so a
  // test can change the value the field receives from outside itself.
  let value = $state('')
</script>

<DateInput {value} {time} onChange={next => (value = next)} />
<span data-value>{value}</span>
