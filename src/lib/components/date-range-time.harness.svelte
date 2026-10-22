<script lang="ts">
  import DateInput from './DateInput.svelte'

  // A range pair with a time row, so a test can drive the hour/minute/second
  // segments and read the pair's values back. The seed is read inside the
  // effect, so the pair follows the props instead of capturing them.
  let { from = '', to = '' }: { from?: string; to?: string } = $props()

  let fromValue = $state('')
  let toValue = $state('')

  $effect(() => {
    fromValue = from
    toValue = to
  })
</script>

<DateInput
  range
  time
  from={fromValue}
  to={toValue}
  onFrom={value => (fromValue = value)}
  onTo={value => (toValue = value)} />
<span data-range>{fromValue} – {toValue}</span>
