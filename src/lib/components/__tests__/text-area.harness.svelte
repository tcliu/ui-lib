<script lang="ts">
  import TextArea from '../TextArea.svelte'

  interface Props {
    value?: string
    ariaLabel?: string
    rows?: number
    disabled?: boolean
    readonly?: boolean
  }

  let { value = '', ariaLabel = 'Notes', rows, disabled, readonly }: Props = $props()
</script>

<TextArea bind:value {ariaLabel} {rows} {disabled} {readonly} placeholder="Write…" />
