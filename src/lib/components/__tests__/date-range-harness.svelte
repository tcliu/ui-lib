<script lang="ts">
  import DateInput from '../DateInput.svelte'

  let from = $state('')
  let to = $state('')
</script>

<DateInput range {from} {to} onFrom={value => (from = value)} onTo={value => (to = value)} />
<span data-range>{from} – {to}</span>
