<script lang="ts">
  import { tick } from 'svelte'
  import Button from './Button.svelte'
  import AutoComplete from './AutoComplete.svelte'
  import ClearButton from './ClearButton.svelte'
  import type { SelectOption } from './SelectDropdown.svelte'
  import FilterIcon from '#lib/icons/FilterIcon.svelte'
  import { useDropdown } from '#lib/actions/use-dropdown.svelte.js'
  import { positionPanel } from '#lib/position-panel.svelte.js'
  import { DEFAULT_PANEL_CLASS } from './select-dropdown-styles'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import type { SizeInput } from '#lib/size-scale.js'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'

  // One column's filter, opened from a funnel trigger in its header: the panel
  // holds the same free-text autocomplete the row used to, so a value can be
  // picked from the column's own set or typed in full, and a label-less clear
  // resets it. The trigger tints while the column is filtered.
  interface Props {
    // Header text, used to label the trigger, the panel, and the clear action.
    column: string
    // Current filter text.
    value: string
    options: SelectOption[]
    onInput: (value: string) => void
    onClear: () => void
    size?: SizeInput
  }

  let { column, value, options, onInput, onClear, size = 'md' }: Props = $props()

  // The panel's own floor and chrome ride the shared axis; the input keeps the
  // table's size. The badge dot marks a column with a set filter without
  // changing the glyph's shape.
  const FILTER_RATIOS = { minW: 12, gap: 0.25, panelPad: 0.375, radius: 0.5, dot: 0.3125, dotRing: 0.125 }
  const filterMetrics = $derived(dimensionMetrics(size, FILTER_RATIOS))
  const filterStyle = $derived(sizeVarStyle('filter', filterMetrics))

  const i18n = getI18nContext()
  const label = $derived(i18n.t('table.filterColumn', { column }))
  const placeholder = $derived(i18n.t('table.filter'))
  const clearLabel = $derived(i18n.t('table.clear', { name: column }))
  const active = $derived(value.trim() !== '')

  let open = $state(false)
  let containerRef = $state<HTMLSpanElement | null>(null)
  let triggerRef = $state<HTMLButtonElement | null>(null)
  let panelRef = $state<HTMLDivElement | null>(null)
  let inputRef = $state<HTMLInputElement | null>(null)

  function close(focusTrigger = false): void {
    open = false
    if (focusTrigger) {
      triggerRef?.focus()
    }
  }

  async function toggle(): Promise<void> {
    open = !open
  }

  // The panel portals into place after `open` flips, so focus the field once
  // the mount and its `inputRef` binding have settled.
  $effect(() => {
    if (!open) {
      return
    }
    void tick().then(() => inputRef?.focus())
  })

  function handleKeydown(event: KeyboardEvent): void {
    if (!open) {
      return
    }
    if (event.key === 'Escape') {
      // Close before viewer-level Escape handling runs, then keep focus.
      event.preventDefault()
      event.stopPropagation()
      close(true)
    }
  }

  function handleFocusOut(event: FocusEvent): void {
    if (!open) {
      return
    }
    const next = event.relatedTarget as Node | null
    if (!next) {
      // A pointer interaction: the outside-click handler owns dismissal, and a
      // click on a suggestion must not tear the panel down mid-pick.
      return
    }
    if (containerRef?.contains(next) || panelRef?.contains(next)) {
      return
    }
    close()
  }

  // The suggestion list portals beside the panel, so it is neither the
  // container nor the panel; its marker class keeps an option click from
  // dismissing the filter, so the pick lands before the panel closes.
  function handleOutsideClick(event: PointerEvent): void {
    const target = event.target as Element | null
    if (target?.closest?.('.filter-suggestions')) {
      return
    }
    close()
  }

  useDropdown(() => ({
    isOpen: () => open,
    container: () => containerRef,
    onOutsideClick: event => handleOutsideClick(event),
    // Escape from the trigger or the panel closes and restores focus, so the
    // unmounting panel never drops focus to the body.
    onEscape: () => close(true),
    panel: () => panelRef,
  }))

  function handleClear(): void {
    onClear()
    inputRef?.focus()
  }

  const suggestionsClass = `filter-suggestions ${DEFAULT_PANEL_CLASS}`
</script>

<span
  class="column-filter relative inline-flex"
  style={filterStyle}
  bind:this={containerRef}
  onfocusout={handleFocusOut}>
  {#snippet triggerIcon()}
    <FilterIcon variant="sheets" />
  {/snippet}
  <span class="relative inline-flex">
    <Button
      variant="ghost"
      size={size}
      className={active ? 'text-cyan-400' : 'text-slate-400'}
      ariaLabel={label}
      tooltip={label}
      ariaExpanded={open}
      onClick={toggle}
      onKeyDown={handleKeydown}
      bind:buttonEl={triggerRef}
      icon={triggerIcon} />
    {#if active}
      <!-- The same bar mark, accented and badged: a filtered column keeps the
           glyph's shape and adds ink instead of swapping icons. -->
      <span
        class="pointer-events-none absolute top-0 right-0 h-[var(--filter-dot)] w-[var(--filter-dot)] translate-x-1/4 -translate-y-1/4 rounded-full bg-cyan-400 ring-[length:var(--filter-dot-ring)] ring-slate-900"
        data-filter-badge
        aria-hidden="true"></span>
    {/if}
  </span>
  {#if open}
    <div
      bind:this={panelRef}
      use:positionPanel={() => ({ getTrigger: () => triggerRef, getOpen: () => open, align: 'left' })}
      class="panel fixed top-0 left-0 z-40 min-w-[var(--filter-min-w,max-content)] rounded-[var(--filter-radius,0.5rem)] border border-slate-700 bg-slate-900/95 p-[var(--filter-panel-pad,0.375rem)] shadow-2xl shadow-slate-950/60 backdrop-blur will-change-transform"
      style={filterStyle}
      role="group"
      aria-label={label}>
      <div class="flex items-center gap-[var(--filter-gap,0.25rem)]">
        <div class="min-w-0 flex-1">
          <AutoComplete
            bind:inputRef
            {value}
            {options}
            {size}
            ariaLabel={label}
            placeholder={placeholder}
            panelClass={suggestionsClass}
            {onInput} />
        </div>
        <ClearButton {size} ariaLabel={clearLabel} disabled={!active} onClick={handleClear} />
      </div>
    </div>
  {/if}
</span>
