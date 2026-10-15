<script lang="ts">
  import Tooltip from './Tooltip.svelte'
  import CloseIcon from '$lib/icons/CloseIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  const i18n = getI18nContext()

  interface Props {
    label: string
    chipClass: string
    style?: string
    removeLabel?: string
    removeButtonClass?: string
    removeButtonStyle?: string
    tooltip?: string
    disabled?: boolean
    onRemove?: () => void
  }

  let {
    label,
    chipClass,
    style = '',
    removeLabel,
    removeButtonClass = '',
    removeButtonStyle = '',
    tooltip,
    disabled = false,
    onRemove,
  }: Props = $props()

  // Derived (not read inline) so a locale switch re-resolves the label.
  const resolvedRemoveLabel = $derived(removeLabel ?? i18n.t('chip.remove', { name: label }))
</script>

<span class={tooltip ? 'group relative inline-flex' : 'inline-flex'}>
  <span {style} class={`${chipClass} inline-flex items-center gap-1`}>
    {label}
    {#if onRemove}
      <button
        type="button"
        aria-label={resolvedRemoveLabel}
        onclick={onRemove}
        {disabled}
        style={removeButtonStyle}
        class={removeButtonClass}>
        <CloseIcon size="xs" />
      </button>
    {/if}
  </span>
  {#if tooltip}
    <Tooltip>{tooltip}</Tooltip>
  {/if}
</span>
