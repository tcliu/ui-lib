<script lang="ts">
  import Tabs from '../Tabs.svelte'
  import type { SizeInput } from '$lib/size-scale'

  interface Props {
    size?: SizeInput
  }

  let { size }: Props = $props()
</script>

{#snippet oneContent()}
  <p>one</p>
{/snippet}

{#snippet twoContent()}
  <p>two</p>
{/snippet}

<Tabs
  tabs={[
    { label: 'One', path: 'one', content: oneContent },
    { label: 'Two', path: 'two', content: twoContent },
  ]}
  state={{}}
  {size} />
