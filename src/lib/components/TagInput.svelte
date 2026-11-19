<script module lang="ts">
  import { INPUT_RATIOS } from './input-chrome'
  import { CLEAR_RATIOS } from './text-input-metrics'

  // The inner input's own share of the row's vertical padding: it rides tighter
  // than the container so a chip row stays compact beside the text entry.
  const INPUT_PAD_Y = 0.125

  // Container ratios: the field's font (its line box derives from it), its own
  // wider padding, the tag gap, the inner input's tighter vertical padding, the
  // width its caret line needs, and the clear cross, which rides the shared text
  // field's clearable metrics: a trimmed button box inside the same clear slot,
  // so the tag row's cross reads exactly like a `TextInput`'s at every size.
  //
  // The container's padding carries only the remainder of a text field's
  // vertical padding, so an empty tag row lands on the same height as a
  // same-size `TextInput` or select trigger (`INPUT_RATIOS.line + 2·padY`)
  // instead of growing by the inner input's share. `padY` is therefore derived
  // from the field padding, and the empty and filled boxes stay one height
  // because the chips stay inside that line box.
  //
  // `inputMinW` is the caret line's own floor, not a comfortable field width:
  // the input grows over the row's remainder, so a wider floor would wrap a row
  // that still had room and drop the caret to a line of its own.
  export const TAG_INPUT_RATIOS = {
    font: INPUT_RATIOS.font,
    padX: 0.625,
    padY: INPUT_RATIOS.padY - INPUT_PAD_Y,
    gap: 0.375,
    inputPadY: INPUT_PAD_Y,
    inputMinW: 0.75,
    ...CLEAR_RATIOS,
  }
  export type TagInputRatios = typeof TAG_INPUT_RATIOS
  export type TagInputRatioOverrides = Partial<TagInputRatios>
</script>

<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import Button from '#lib/components/Button.svelte'
  import Chip from '#lib/components/Chip.svelte'
  import { CHIP_COLORS, chipVariantClass } from '#lib/chip-variants.js'
  import ListboxPanel from '#lib/components/ListboxPanel.svelte'
  import TextInput from '#lib/components/TextInput.svelte'
  import CloseIcon from '#lib/icons/CloseIcon.svelte'
  import { DEFAULT_CHIP_PANEL_CLASS } from '#lib/dropdown-chrome.js'
  import { useListbox } from '#lib/actions/use-listbox.svelte.js'
  import { createComboboxEntry } from '#lib/actions/combobox-entry.js'
  import { matchLabelParts } from '#lib/actions/option-index.js'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import { type SizeInput } from '#lib/size-scale.js'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import { resolveClearMetrics, withLine } from './text-input-metrics'
  import type { ClearableProps } from './clearable-props'

  interface Props extends ClearableProps {
    value?: string[]
    // Baseline the clear affordance compares against (element-wise, in
    // order): the cross hides while `value` matches it (empty when unset),
    // and the fallback clear writes it back. A provided `onClear` still owns
    // the clear.
    defaultValue?: string[]
    options?: string[]
    onChange?: (next: string[]) => void
    // Called with the current draft on every keystroke, so a caller can supply
    // externally filtered (e.g. async) `options`.
    onQueryChange?: (query: string) => void
    placeholder?: string
    disabled?: boolean
    id?: string
    size?: SizeInput
    // Partial override of the container's metric ratios (font, both paddings,
    // gap, the inner input's vertical padding and caret-line width, and the
    // clear cross's button, gutter, and slot); omitted keys keep the shared
    // defaults. The line box follows `font`, the clear inset follows `padX`, and
    // the clear defaults ride `TextInput`'s clearable design.
    ratios?: TagInputRatioOverrides
    chipClass?: string | ((tag: string) => string)
    // Colour classes per tag when `chipClass` is not given; replaces the
    // built-in palette.
    palette?: readonly string[]
    // Inline style per tag for the chip (the caller owns the colour
    // treatment); the chip's own metrics stay with the shared component.
    chipStyle?: (tag: string) => string | undefined
    // Inline style for the dot that precedes the option label in the
    // suggestion panel; the dot itself is the shared component's, so only
    // its colour is the caller's.
    optionDotStyle?: (tag: string) => string | undefined
    chip?: Snippet<[tag: string, remove: () => void]>
    option?: Snippet<[tag: string]>
    // The cross belongs with the tags, so `clearPlacement` `auto` overlays
    // the box's own right edge; an explicit `outside` sits after the box as
    // a sibling instead.
  }

  let {
    value = [],
    defaultValue,
    options = [],
    onChange,
    onQueryChange,
    placeholder = '',
    disabled = false,
    id,
    size = 'md',
    ratios,
    chipClass,
    palette,
    chipStyle,
    optionDotStyle,
    chip,
    option,
    clearable = false,
    clearLabel,
    clearPlacement = 'auto',
    onClear,
  }: Props = $props()
  const i18n = getI18nContext()

  // Built-in per-tag chip colours: a deterministic palette so tags read
  // distinctly with zero config, built from the shared chip color tokens.
  // `chipClass` overrides it (a function per tag, a string for all), and
  // `palette` replaces it wholesale. The default palette carries the pill frame
  // with each token; a caller-supplied `chipClass` owns the whole class string
  // (shape included), so a caller with its own chip shape passes it unchanged,
  // while a caller `palette` is color-only and gets the shared frame prefixed.
  const DEFAULT_TAG_COLORS = CHIP_COLORS.map(color => chipVariantClass(color, 'soft'))

  const CHIP_FRAME = 'rounded-full border'

  // FNV-1a: a well-distributed hash so nearby tags do not collide on a colour.
  function hashTag(tag: string): number {
    let hash = 2166136261
    for (const ch of tag) {
      hash ^= ch.charCodeAt(0)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }

  function resolveChipClass(tag: string): string {
    if (typeof chipClass === 'function') return chipClass(tag)
    if (chipClass) return chipClass
    if (palette && palette.length > 0) {
      return `${CHIP_FRAME} ${palette[hashTag(tag) % palette.length]}`
    }
    return DEFAULT_TAG_COLORS[hashTag(tag) % DEFAULT_TAG_COLORS.length]
  }

  // Every metric is a fixed ratio of the size dimension, so each keeps a
  // constant metric:dimension ratio across the whole range. The container pads
  // wider than a text field (`padX` exceeds `--input-pad-x`, so the tag row
  // keeps its own inset); the chips size themselves from the same dimension
  // (their metrics live in `Chip`), and the input rides tighter type so mixed
  // content stays compact. The row's line box follows the font, so one font
  // retune carries its height.
  const resolvedRatios = $derived({ ...TAG_INPUT_RATIOS, ...ratios })
  // The container's own `--tag-*` vars: its text row only. The clear slot's keys
  // stay out of this prefix (they ride `--clear-*`, like every clearable field).
  const metrics = $derived(
    dimensionMetrics(
      size,
      withLine({
        font: resolvedRatios.font,
        padX: resolvedRatios.padX,
        padY: resolvedRatios.padY,
        gap: resolvedRatios.gap,
        inputPadY: resolvedRatios.inputPadY,
        inputMinW: resolvedRatios.inputMinW,
      }),
    ),
  )
  const style = $derived(sizeVarStyle('tag', metrics))

  let uid = $props.id()
  const listboxId = `${uid}-tag-suggestions`

  let draft = $state('')
  let open = $state(false)
  let navigated = false
  let inputRef = $state<HTMLInputElement | null>(null)
  let containerRef = $state<HTMLDivElement | null>(null)
  let panelRef = $state<HTMLDivElement | null>(null)
  // Suggestion elements by index, registered by the shared panel so the
  // listbox core can reveal the active row (never queried from the DOM).
  let optionEls = $state<(HTMLElement | null)[]>([])

  function setOptionEl(index: number, el: HTMLElement | null): void {
    optionEls[index] = el
  }

  const query = $derived(draft.trim().toLowerCase())
  const suggestions = $derived.by(() => {
    const selected = new Set(value.map(tag => tag.toLowerCase()))
    return options.filter(
      tag => !selected.has(tag.toLowerCase()) && (!query || tag.toLowerCase().includes(query)),
    )
  })

  // Emphasize the typed part of each label only while the query is ambiguous:
  // with two or more matches the user needs to see which part matched, while a
  // lone match is already the only row and needs no extra emphasis.
  const highlightMatches = $derived(query !== '' && suggestions.length > 1)

  // Split a label around its matched span (shared helper), or return null when
  // highlighting is off for an unambiguous single match.
  function labelParts(tag: string) {
    return highlightMatches ? matchLabelParts(tag, query) : null
  }

  // `listbox` is created below; these effects run after setup, so the forward
  // reference is safe.
  // Reset the highlight whenever the visible suggestion list changes
  // (filter typing, add/remove) so arrows never start from a stale row.
  let lastSuggestions: string[] | null = null
  $effect(() => {
    if (!open) return
    if (lastSuggestions !== suggestions) {
      lastSuggestions = suggestions
      listbox.selection.reset()
    }
  })

  $effect(() => {
    if (!open) return
    listbox.selection.clamp(suggestions.length)
  })

  export function focus(): void {
    inputRef?.focus()
  }

  function emit(): void {
    onChange?.([...value])
  }

  function addName(name: string): void {
    const trimmed = name.trim()
    if (!trimmed) return
    if (value.some(tag => tag.toLowerCase() === trimmed.toLowerCase())) return
    value = [...value, trimmed]
    emit()
  }

  // Every programmatic draft change notifies `onQueryChange` too, so a caller
  // driving externally filtered suggestions resets its query with the field.
  function setDraft(next: string): void {
    draft = next
    onQueryChange?.(next)
  }

  function commitDraft(): void {
    const names = draft
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
    setDraft('')
    navigated = false
    if (!names.length) return
    const seen = new Set(value.map(tag => tag.toLowerCase()))
    const next = [...value]
    for (const name of names) {
      if (seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      next.push(name)
    }
    value = next
    emit()
  }

  function addSuggestion(tag: string): void {
    setDraft('')
    navigated = false
    addName(tag)
    tick().then(() => inputRef?.focus())
  }

  function removeAt(index: number): void {
    value = value.filter((_, i) => i !== index)
    emit()
    tick().then(() => inputRef?.focus())
  }

  // Element-wise, in-order comparison: any addition, removal, reorder, or
  // edit (including case) is something to clear.
  function tagsEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((tag, index) => tag === b[index])
  }

  // A disabled field offers no clear action, and while `value` matches
  // `defaultValue` (empty when unset) there is nothing to clear, so the cross
  // hides.
  const showClear = $derived(clearable && !tagsEqual(value ?? [], defaultValue ?? []) && !disabled)
  const resolvedClearLabel = $derived(clearLabel ?? i18n.t('common.clear'))
  // Every combobox needs a name: the placeholder when the caller sets one,
  // otherwise the localized suggestions label (never an empty string).
  const resolvedAriaLabel = $derived(placeholder || i18n.t('tagInput.suggestions'))
  // The hint describes an empty field. Once tags occupy the row the entry has
  // only the remainder to type in, where the hint would clip mid-word and read
  // as content, so it drops while keeping the combobox's accessible name.
  const resolvedPlaceholder = $derived(value.length > 0 ? '' : placeholder)
  const placement = $derived(clearPlacement === 'auto' ? 'inside' : clearPlacement)
  // The container that hosts the clear button is chosen from `clearable`, not
  // from whether tags are present, so toggling the value never recreates the
  // box (which would drop focus) — only the button itself toggles.
  const insideField = $derived(clearable && placement === 'inside')
  const outsideField = $derived(clearable && placement === 'outside')
  const clearInside = $derived(showClear && insideField)

  // Inside-clear metrics: the cross rides `TextInput`'s clearable design — a
  // trimmed button box inside the shared clear slot — the inset matches the
  // box's horizontal padding, and the gutter reserves room for the cross, so
  // chips never run under the overlay. The gutter is reserved whenever the
  // inside clear is configured, not only while tags show the button, so the
  // content keeps the same width filled and at default.
  const clearMetrics = $derived(resolveClearMetrics(size, resolvedRatios.padX, resolvedRatios))
  const clearStyle = $derived(sizeVarStyle('clear', clearMetrics))
  // The first tag row's box: the inner input's line plus its tighter vertical
  // padding. Anchoring the clear slot to this height (not the box's own) keeps
  // it on the first row however many the tags span, and centering the button
  // inside it reproduces the single-row placement at any row count.
  const clearRowHeight = 'calc(var(--tag-line) + 2 * var(--tag-input-pad-y))'
  // The outside row resolves the same first-row slot from the tag and clear
  // vars, so its cross sits at the identical height as the inside one.
  const outsideRowStyle = $derived(
    [`gap:${metrics.gap}px`, style, clearStyle].filter(Boolean).join(';'),
  )
  const boxStyle = $derived(
    [style, insideField ? clearStyle : '', insideField ? 'padding-right:var(--clear-gutter)' : '']
      .filter(Boolean)
      .join(';'),
  )

  // A provided handler owns the clear; otherwise the list resets to a copy of
  // the default (never the prop array itself). Focus returns to the field, so
  // the control stays reachable after the cross disappears with it.
  function handleClear(): void {
    if (onClear) {
      onClear()
    } else {
      value = [...(defaultValue ?? [])]
      emit()
    }
    inputRef?.focus()
  }

  function openPanel(): void {
    if (disabled) return
    // Opening starts a fresh list: no stale highlight and no stale navigation
    // from a panel the user already dismissed.
    lastSuggestions = suggestions
    navigated = false
    listbox.selection.reset()
    open = true
  }

  // Entry and navigation gestures are the shared text-combobox ones: focus,
  // a click, or typing brings a dismissed panel back, and the arrow keys drive
  // the listbox. Enter stays this field's own (commit the draft, or take the
  // highlighted row after an explicit navigation).
  const entry = createComboboxEntry({
    isOpen: () => open,
    openPanel,
    move: direction => listbox.moveHighlight(direction),
    count: () => suggestions.length,
    onInput: () => {
      navigated = false
      onQueryChange?.(draft)
    },
    onNavigate: () => {
      navigated = true
    },
  })

  function handleKeydown(event: KeyboardEvent): void {
    if (entry.handleKeydown(event)) return
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (event.key === 'Enter' && open && suggestions.length > 0 && (navigated || !draft.trim())) {
        addSuggestion(suggestions[listbox.selection.index] ?? suggestions[0])
        return
      }
      commitDraft()
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      removeAt(value.length - 1)
    }
  }

  const listbox = useListbox({
    isOpen: () => open,
    onClose: () => {
      commitDraft()
      open = false
    },
    openPanel,
    options: () => suggestions,
    optionLabel: tag => tag,
    getContainer: () => containerRef,
    getPanel: () => panelRef,
    getOptionEl: index => optionEls[index],
    onOutsideClick: () => {
      commitDraft()
      open = false
    },
    onEscape: () => {
      // Escape dismisses the suggestions, keeping focus and the draft so the
      // next Enter commits what the user typed; typing, a click, or an arrow
      // brings the list back.
      open = false
    },
    onScrollClose: () => {
      open = false
    },
  })
</script>

{#snippet closeIcon()}
  <CloseIcon />
{/snippet}
{#snippet clearControl()}
  <!-- Ghost keeps the cross unobtrusive; it rides the shared clear design (a
       trimmed button box inside its reserved slot) so the tag row's cross
       matches a text field's at every size. -->
  <Button
    variant="ghost"
    size={clearMetrics.button}
    icon={closeIcon}
    ariaLabel={resolvedClearLabel}
    onClick={handleClear}
    className="size-[var(--clear-box)] shrink-0" />
{/snippet}
{#snippet fieldBox()}
  <div
    bind:this={containerRef}
    data-escape-capture={open ? '' : null}
    onfocusout={listbox.handleFocusOut}
    style={boxStyle}
    class={`rounded-lg border border-slate-700 bg-slate-950 px-[var(--tag-pad-x)] py-[var(--tag-pad-y)] transition focus-within:border-cyan-500${insideField ? ' relative' : ''}`}>
    <div class="flex flex-wrap items-center gap-[var(--tag-gap)]">
      {#each value as tag, index (tag.toLowerCase())}
        {#if chip}
          {@render chip(tag, () => removeAt(index))}
        {:else}
          <Chip
            label={tag}
            chipClass={resolveChipClass(tag)}
            style={chipStyle?.(tag) ?? ''}
            size={size}
            removable
            removeLabel={i18n.t('tagInput.remove', { name: tag })}
            onRemove={() => removeAt(index)}
            {disabled}
            removeButtonClass="rounded-full p-0.5 opacity-60 transition-opacity outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40" />
        {/if}
      {/each}
      <TextInput
        bind:inputRef
        bind:value={draft}
        id={id}
        {size}
        variant="embedded"
        className="min-w-[var(--tag-input-min-w)] flex-1 py-[var(--tag-input-pad-y)] text-[length:var(--tag-font)] leading-[var(--tag-line)] text-slate-100 placeholder:text-slate-500"
        placeholder={resolvedPlaceholder}
        {disabled}
        role="combobox"
        ariaLabel={resolvedAriaLabel}
        aria-expanded={open && suggestions.length > 0}
        aria-controls={open && suggestions.length > 0 ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && suggestions.length > 0
          ? `${listboxId}-option-${listbox.selection.index}`
          : undefined}
        autocomplete="off"
        onfocus={entry.handleFocus}
        onclick={entry.handleClick}
        oninput={entry.handleInput}
        onkeydown={handleKeydown} />
    </div>
    {#if clearInside}
      <!-- Overlays the box's own right edge, anchored to the first tag row (not
        the box's height) so wrapping tags never move it; the flex centers the
        button in that row, and the reserved gutter keeps chips clear of it on
        every row. -->
      <span
        class="absolute right-[var(--clear-inset)] flex items-center"
        style={`top:var(--tag-pad-y);height:${clearRowHeight}`}>
        {@render clearControl()}
      </span>
    {/if}
  </div>
{/snippet}
{#if outsideField}
  <!-- The chips own the box content, so the clear sits after it as a sibling
    (like the dropdown surfaces), anchored to the box's first row. Only the
    button toggles with the value, but its slot is reserved even while empty (an
    inert spacer the size of the cross) so the input keeps the same width empty
    and filled. -->
  <div class="flex items-start" style={outsideRowStyle}>
    <div class="min-w-0 flex-1">{@render fieldBox()}</div>
    {#if showClear}
      <span
        class="inline-flex items-center"
        style={`margin-top:calc(var(--tag-pad-y) + 1px);height:${clearRowHeight}`}>
        {@render clearControl()}
      </span>
    {:else}
      <span
        aria-hidden="true"
        class="h-[var(--clear-box)] w-[var(--clear-box)] shrink-0 max-phone:h-11 max-phone:w-11"
        style="margin-top:calc(var(--tag-pad-y) + 1px)"></span>
    {/if}
  </div>
{:else}
  {@render fieldBox()}
{/if}
{#snippet panelOption(tag: string)}
  {#if option}
    {@render option(tag)}
  {/if}
{/snippet}
{#snippet panelLeading(tag: string)}
  {@const dotStyle = optionDotStyle?.(tag)}
  {#if dotStyle}
    <span class="h-2 w-2 shrink-0 rounded-full" style={dotStyle}></span>
  {/if}
{/snippet}
{#if open && suggestions.length > 0}
  <ListboxPanel
    bind:panelEl={panelRef}
    id={listboxId}
    ariaLabel={i18n.t('tagInput.suggestions')}
    panelClass={DEFAULT_CHIP_PANEL_CLASS}
    optionRowClass="flex w-full cursor-pointer items-center gap-2 rounded-md px-[var(--tag-pad-x)] py-[var(--tag-pad-y)] text-left text-[length:var(--tag-font)] leading-[var(--tag-line)] transition-none outline-none max-phone:min-h-11"
    optionRowStyle={style}
    options={suggestions}
    highlightFlags={listbox.highlight.flags}
    isActive={(_tag, index) => index === listbox.selection.index}
    onSelect={tag => addSuggestion(tag)}
    onActivate={index => {
      navigated = true
      listbox.selection.set(index)
    }}
    setOptionEl={setOptionEl}
    getTrigger={() => containerRef}
    getOpen={() => open}
    activeClass="bg-slate-800 text-cyan-200"
    idleClass="text-slate-300 hover:bg-slate-800 hover:text-cyan-200 focus:bg-slate-800 focus:text-cyan-200"
    optionKey={tag => tag.toLowerCase()}
    labelOf={tag => tag}
    matchParts={tag => labelParts(tag)}
    leading={optionDotStyle ? panelLeading : undefined}
    option={option ? panelOption : undefined} />
{/if}
