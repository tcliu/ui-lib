<script lang="ts">
  import FormField from '$lib/components/FormField.svelte'

  interface HarnessProps {
    layout?: 'stacked' | 'inline'
  }

  let { layout }: HarnessProps = $props()
</script>

<FormField label="Label" htmlFor="field" {layout}>
  <input id="field" />
</FormField>
