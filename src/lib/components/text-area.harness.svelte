<script lang="ts">
  import TextArea from './TextArea.svelte'
  import type { FieldRatioOverrides } from './input-chrome'

  interface Props {
    value?: string
    ariaLabel?: string
    rows?: number
    disabled?: boolean
    readonly?: boolean
    ratios?: FieldRatioOverrides
  }

  let { value = '', ariaLabel = 'Notes', rows, disabled, readonly, ratios }: Props = $props()
</script>

<TextArea bind:value {ariaLabel} {rows} {disabled} {readonly} {ratios} placeholder="Write…" />
