<script lang="ts">
  import FormField from '#lib/components/FormField.svelte'
  import type { SizeInput } from '#lib/size-scale.js'

  interface HarnessProps {
    layout?: 'stacked' | 'inline'
    size?: SizeInput
  }

  let { layout, size }: HarnessProps = $props()
</script>

<FormField label="Label" htmlFor="field" {layout} {size}>
  <input id="field" />
</FormField>
