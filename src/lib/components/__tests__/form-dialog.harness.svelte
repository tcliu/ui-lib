<script lang="ts">
  import FormDialog from '../FormDialog.svelte'

  interface Props {
    dirty?: boolean
    // Renders a caller-supplied footer row instead of the built-in pair; the
    // row submits the form through the id the snippet receives.
    customFooter?: boolean
    onSave?: () => void
    onReset?: () => void
    onClose?: () => void
  }

  let {
    dirty = true,
    customFooter = false,
    onSave = () => {},
    onReset = () => {},
    onClose = () => {},
  }: Props = $props()
</script>

{#snippet customRow()}
  <button type="submit" data-testid="custom-save">Custom save</button>
{/snippet}

<FormDialog
  title="Edit record"
  closeLabel="Close"
  saveLabel="Save"
  resetLabel="Reset"
  discardTitle="Discard unsaved changes?"
  discardMessage="Your changes will be lost."
  discardLabel="Discard"
  {dirty}
  footer={customFooter ? customRow : undefined}
  {onSave}
  {onReset}
  {onClose} />
