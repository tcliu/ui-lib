<script lang="ts">
  import Button from './Button.svelte'
  import CloseIcon from '../icons/CloseIcon.svelte'
  import { getI18nContext } from '../i18n/store.svelte.js'
  import type { SizeInput } from '../size-scale.js'
  import { TEXT_INPUT_RATIOS, resolveClearMetrics } from './text-input-metrics'
  import { sizeVarStyle } from './size-metrics'

  interface Props {
    // Accessible name; defaults to the shared "Clear" label.
    ariaLabel?: string
    // The field size whose clear cross this button matches.
    size?: SizeInput
    disabled?: boolean
    tooltip?: string
    onClick: () => void
  }

  let { ariaLabel, size = 'md', disabled = false, tooltip, onClick }: Props = $props()

  const i18n = getI18nContext()
  const resolvedLabel = $derived(ariaLabel ?? i18n.t('common.clear'))
  // The standalone cross rides the same metric set as a clearable field's, so
  // its glyph and box stay in lockstep with `TextInput`/`TagInput`/`TextArea`.
  const clearMetrics = $derived(resolveClearMetrics(size, TEXT_INPUT_RATIOS.padX, TEXT_INPUT_RATIOS))
  const clearStyle = $derived(sizeVarStyle('clear', clearMetrics))
</script>

<span class="inline-flex shrink-0" style={clearStyle}>
  <Button
    variant="ghost"
    size={clearMetrics.button}
    ariaLabel={resolvedLabel}
    className="size-[var(--clear-box)] shrink-0"
    {disabled}
    {tooltip}
    {onClick}>
    {#snippet icon()}<CloseIcon />{/snippet}
  </Button>
</span>
