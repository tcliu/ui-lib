<script lang="ts">
  import { flushSync, tick, type Snippet } from 'svelte'
  import { useListbox } from '#lib/actions/use-listbox.svelte.js'
  import { isModifiedNavKey } from '#lib/actions/listbox-keynav.js'
  import Button from '#lib/components/Button.svelte'
  import ListboxPanel from '#lib/components/ListboxPanel.svelte'
  import TextInput from '#lib/components/TextInput.svelte'
  import { useCaretAtEnd } from './use-caret-at-end.svelte'
  import { useSelectFilter } from './use-select-filter.svelte'
  import ChevronDownIcon from '#lib/icons/ChevronDownIcon.svelte'
  import CloseIcon from '#lib/icons/CloseIcon.svelte'
  import type { DropdownPanelProps } from '#lib/dropdown-chrome.js'
  import { ICON_RATIO, type SizeInput } from '#lib/size-scale.js'
  import {
    DEFAULT_PANEL_CLASS,
    SELECT_BOX_UTILITIES,
    SELECT_TRIGGER_UTILITIES,
    SELECT_RATIOS,
    TRIGGER_BASE,
    TRIGGER_EMBEDDED,
    TRIGGER_NO_OUTLINE,
    OPTION_BASE,
    EMPTY_BASE,
    type SelectRatioOverrides,
  } from './select-dropdown-styles'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import { withLine } from './text-input-metrics'
  import type { ClearableProps } from './clearable-props'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'

  const i18n = getI18nContext()

  // Accepted option shape: a bare string is its own label, and a missing
  // label falls back to the value, so `'two'` and `{ value: 'two' }` both
  // display as `two`.
  export type SelectOption = string | { value: string; label?: string }

  interface NormalizedOption {
    value: string
    label: string
  }

  interface Props extends DropdownPanelProps, Omit<ClearableProps, 'clearPlacement'> {
    // Overrides the derived trigger label (the committed option's label, or
    // the raw value when it matches nothing). Omit it and the trigger tracks
    // the value on its own.
    buttonLabel?: string
    // Baseline the clear affordance compares against: the cross hides while
    // `activeValue` matches it (empty when unset), and the fallback clear
    // writes it back. A provided `onClear` still owns the clear.
    defaultValue?: string
    options: SelectOption[]
    activeValue?: string
    ariaLabel?: string
    filterable?: boolean
    // Lets Enter commit the typed text via `onSelect` when it matches no
    // option. Only applies to the filterable input; off by default so
    // existing callers are unchanged.
    allowCustomValue?: boolean
    size?: SizeInput
    // Partial override of the trigger's metric ratios (font, both paddings, the
    // chevron's own gutter, min-width, gap, and icon slot); omitted keys keep
    // the shared defaults. The line box follows `font`.
    ratios?: SelectRatioOverrides
    // Chrome variant: `bordered` (default) is the shared trigger box;
    // `embedded` drops the border, surface, and focus styles for a trigger
    // inside another surface.
    variant?: 'bordered' | 'embedded'
    // Drop the bordered trigger's outline (border, hover tint, focus border)
    // while keeping its surface, metrics, and text rules.
    hideOutline?: boolean
    onSelect: (value: string) => void
    buttonClass?: string
    controlClass?: string
    optionClass?: string
    emptyLabel?: string
    // Content rendered in the trigger's flex row before the text/label. The
    // caller owns its size and look (a leading search icon or glyph); it takes
    // its own space and pushes the text, so both trigger paths render it alike.
    leading?: Snippet
    // Content rendered outside the trigger, after it (and after the clear
    // affordance), in a size-scaled row. The trigger gives up no room to it;
    // the caller owns its look and behaviour.
    trailer?: Snippet
    // No `trailing` and no `clearPlacement`: the trigger's right edge belongs
    // to the built-in chevron, so the clear sits on its own right edge and a
    // caller adornment goes in `leading` (inside) or `trailer` (outside).
    // `onClear` falls back to selecting the default value.
  }

  let {
    buttonLabel,
    defaultValue,
    options,
    activeValue = '',
    ariaLabel,
    align = 'left',
    autoPlace = true,
    filterable = false,
    allowCustomValue = false,
    onSelect,
    size = 'md',
    ratios,
    variant = 'bordered',
    hideOutline = false,
    buttonClass,
    controlClass,
    optionClass,
    emptyLabel,
    leading,
    trailer,
    clearable = false,
    clearLabel,
    onClear,
    panelClass,
  }: Props = $props()

  let id = $props.id()
  const panelId = `${id}-panel`

  // Normalize once per options array so every row below reads one shape.
  const normalizedOptions = $derived(
    options.map((option): NormalizedOption =>
      typeof option === 'string'
        ? { value: option, label: option }
        : { value: option.value, label: option.label ?? option.value },
    ),
  )

  // Trigger label: an explicit override wins; otherwise the committed option's
  // label, falling back to the raw value when it matches nothing.
  const resolvedButtonLabel = $derived(
    buttonLabel ?? normalizedOptions.find(option => option.value === activeValue)?.label ?? activeValue,
  )

  // Every metric is a fixed ratio of the size dimension, so each keeps a
  // constant metric:dimension ratio across the range; the icon slot is the
  // dimension itself (ratio 1) and the line box follows the font.
  const resolvedRatios = $derived({ ...SELECT_RATIOS, ...ratios })
  // The text box takes the shared field metrics (`--input-*`), exactly as
  // `TextInput` emits them; only the select's own min-width, chevron gutters,
  // clear-row gap, and icon slot stay in the `--sel-*` namespace.
  const fieldMetrics = $derived(
    dimensionMetrics(
      size,
      withLine({
        font: resolvedRatios.font,
        padX: resolvedRatios.padX,
        padY: resolvedRatios.padY,
      }),
    ),
  )
  const selectMetrics = $derived(
    dimensionMetrics(size, {
      minW: resolvedRatios.minW,
      chevronGap: resolvedRatios.chevronGap,
      chevronTextGap: resolvedRatios.chevronTextGap,
      gap: resolvedRatios.gap,
      icon: resolvedRatios.icon,
    }),
  )
  const style = $derived(
    [sizeVarStyle('input', fieldMetrics), sizeVarStyle('sel', selectMetrics)].join(';'),
  )
  // The trigger's direction marker and its clear cross ride a trimmed share of
  // the icon slot: at the full dimension each reads as loud as the label beside
  // it, so they take 0.625 of it — the same share `TextInput`'s clear cross
  // rides — staying lighter affordances that still scale with the control.
  const affordanceSize = $derived(selectMetrics.icon * 0.625)
  // The chevron's laid-out box is the rendered glyph (its affordance slot times
  // the shared icon ratio); a filterable field reserves that glyph plus the
  // text gap in its right gutter.
  const chevronGlyph = $derived(affordanceSize * ICON_RATIO)
  // The filterable field's frame stretches to the trigger box (so the trailing
  // chevron sits at the box edge even when `min-w` floors it) and carries the
  // glyph and text-gap metrics the input's right gutter consumes. They ride the
  // frame rather than the caller-overridable box, so a `controlClass` override
  // cannot drop them.
  const filterFrameStyle = $derived(
    [
      'flex:1 1 auto',
      'min-width:0',
      `--sel-chevron-glyph:${chevronGlyph}px`,
      `--sel-chevron-text-gap:${selectMetrics.chevronTextGap}px`,
    ].join(';'),
  )
  const filterInputGutter = 'pr-[calc(var(--sel-chevron-glyph)+var(--sel-chevron-text-gap))]'

  const triggerBoxClass = $derived(
    `${SELECT_TRIGGER_UTILITIES} ${
      variant === 'embedded' ? TRIGGER_EMBEDDED : hideOutline ? TRIGGER_NO_OUTLINE : TRIGGER_BASE
    }`,
  )
  // The border and focus treatments belong to the bordered chrome together;
  // `embedded` and `hideOutline` leave them to the caller, like the shared
  // text-field chrome.
  const outlined = $derived(variant === 'bordered' && !hideOutline)

  const resolvedButtonClass = $derived(
    buttonClass ??
      `${triggerBoxClass} ${outlined ? 'focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-cyan-500' : ''}`.trim(),
  )

  const resolvedButtonStyle = $derived(buttonClass ? undefined : style)

  const resolvedControlClass = $derived(
    controlClass ?? `${triggerBoxClass} ${outlined ? 'focus-within:border-cyan-500' : ''}`.trim(),
  )

  const resolvedControlStyle = $derived(controlClass ? undefined : style)

  const resolvedPanelClass = $derived(panelClass ?? DEFAULT_PANEL_CLASS)

  const resolvedOptionRowClass = $derived(optionClass ?? `${SELECT_BOX_UTILITIES} ${OPTION_BASE}`)

  const resolvedOptionRowStyle = $derived(optionClass ? undefined : style)

  const resolvedEmptyRowClass = $derived(`${SELECT_BOX_UTILITIES} ${EMPTY_BASE}`)

  // No override exists for the empty row (callers only supply its label), so
  // its class is always ours and the geometry style always applies with it —
  // unlike the option rows, where `optionClass` takes over both.
  const resolvedEmptyRowStyle = $derived(style)
  const resolvedClearLabel = $derived(clearLabel ?? i18n.t('common.clear'))
  // While `activeValue` matches `defaultValue` (empty when unset) there is
  // nothing to clear, so the cross hides.
  const showClear = $derived(clearable && (activeValue ?? '') !== (defaultValue ?? ''))
  let open = $state(false)
  let containerRef = $state<HTMLDivElement | null>(null)
  let inputRef = $state<HTMLInputElement | null>(null)
  let controlRef = $state<HTMLButtonElement | null>(null)
  let panelRef = $state<HTMLDivElement | null>(null)
  // Option elements by index, registered by the shared panel so the listbox
  // core can reveal the active row (never queried from the DOM).
  let optionEls = $state<(HTMLElement | null)[]>([])

  function setOptionEl(index: number, el: HTMLElement | null): void {
    optionEls[index] = el
  }
  // Whether the filterable control input holds focus (bound from its events,
  // never read from `document.activeElement`).
  let inputFocused = $state(false)
  let filterText = $state('')
  // Whether the user has edited the filter since it was (pre)filled. While
  // pristine, the text is just the current value echoed back, so the panel
  // shows every option; once edited, the text is a real query — including one
  // that happens to equal the current label.
  let filterDirty = $state(false)
  // The query restored when the panel reopens with focus retained. While the
  // user types it is the typed text; once a value is confirmed it becomes that
  // value's label, so reopening filters by the confirmed value shown in the
  // input instead of reverting it to the raw typed query. While the panel is
  // closed the input shows the selected value.
  let activeQuery = $state('')
  let suppressOpenOnFocus = false

  // Filtering and match highlighting read one shared state, so the option list
  // and the emphasized span can never disagree.
  const filter = useSelectFilter({
    options: () => normalizedOptions,
    filterable: () => filterable,
    dirty: () => filterDirty,
    text: () => filterText,
    echoedLabel: () => resolvedButtonLabel,
  })
  const filteredOptions = $derived(filter.filteredOptions)

  function labelParts(label: string) {
    return filter.labelParts(label)
  }

  $effect(() => {
    if (!open && !filterDirty) {
      filterText = resolvedButtonLabel
    }
  })

  // `listbox` is created below; these effects run after setup, so the forward
  // reference is safe.
  // Reset the highlight to the top of the visible list whenever it changes
  // (filter typing, options prop swap) so the cursor does not stay stranded
  // on a row that has scrolled out of view.
  let lastFilteredOptions: NormalizedOption[] | null = null
  $effect(() => {
    if (!open) return
    if (lastFilteredOptions !== filteredOptions) {
      lastFilteredOptions = filteredOptions
      listbox.selection.reset()
    }
  })

  $effect(() => {
    if (!open) return
    listbox.selection.clamp(filteredOptions.length)
  })

  function close() {
    open = false
  }

  // Escape drops focus the way moving away does: blur the trigger and let
  // the existing focusout path close the panel, so focus never lingers on a
  // dismissed control.
  function blurControl() {
    const control = inputRef ?? controlRef
    control?.blur()
  }

  function toggle() {
    if (open) {
      close()
    } else {
      openPanel()
    }
  }

  function openPanel() {
    // Restore the query the user typed before selecting so reopening shows the
    // same filtered list; a pristine open (no query) shows every option.
    if (filterable && filterDirty) {
      filterText = activeQuery
    }
    lastFilteredOptions = filteredOptions
    // Highlight the committed value on open; hover/arrows move from there.
    listbox.selection.syncToActive(filteredOptions, option => option.value === activeValue)
    open = true
    // A long list would otherwise open with the highlighted row scrolled out of
    // sight: the option never receives focus (aria-activedescendant pattern), so
    // nothing else brings it into view, and a native select always shows the
    // selected row. Reveal after the flush, once `positionPanel` has portaled
    // and shown the panel — an effect here runs too early to scroll it.
    void tick().then(() => listbox.revealActive())
  }

  // Tabbing (or clicking) into the prefilled combobox lands the caret after
  // the current value rather than leaving the whole label selected (a browser
  // may select all when the input gains focus), so the next keystroke
  // appends to the filter instead of replacing it. A non-collapsed selection
  // that is not the whole value is a deliberate drag-select and is left
  // alone; defer a frame so it wins over the browser's own selection. If the
  // selection changed between scheduling and the frame (the user pressed
  // Shift+Home / Ctrl+A in the meantime), the deferred fix backs off rather
  // than collapsing the selection the user just made.
  const caret = useCaretAtEnd({
    element: () => inputRef,
    focused: () => inputFocused,
  })

  function handleControlFocus() {
    inputFocused = true
    caret.placeCaretAtEnd()
    if (suppressOpenOnFocus) {
      suppressOpenOnFocus = false
      return
    }
    openPanel()
  }

  function handleControlClick(event: MouseEvent) {
    if (!open) {
      openPanel()
    }
    if (event.detail !== 1) {
      return
    }
    caret.placeCaretAtEnd()
  }

  // Double-clicking the input selects the whole value, so the next keystroke
  // replaces the filter instead of editing one word inside the echoed value.
  // A pending caret fix is dropped first: it would otherwise collapse this
  // selection back to the end.
  function handleControlDblClick() {
    if (!inputRef) {
      return
    }
    caret.cancel()
    inputRef.setSelectionRange(0, inputRef.value.length)
  }

  // Typing into the closed combobox reopens the panel so the edited query
  // filters live. After Enter confirms a value the input keeps focus, so no
  // focus (or click) event fires to open it again.
  function handleControlInput() {
    filterDirty = true
    activeQuery = inputRef?.value ?? filterText
    if (!open) {
      openPanel()
    }
  }

  // Leaving the control drops the typed query: the input falls back to showing
  // the committed value and the next open starts from the full list. Only the
  // Enter-select-and-reopen path (focus retained) keeps the query active.
  function handleControlBlur() {
    inputFocused = false
    filterDirty = false
    activeQuery = ''
    if (filterable) {
      filterText = resolvedButtonLabel
    }
  }

  // Clearing hides the cross with the value, so return focus to the trigger
  // instead of dropping it to the body. A provided handler owns the clear;
  // otherwise the default value is selected.
  function handleClear() {
    close()
    if (onClear) {
      onClear()
    } else {
      onSelect(defaultValue ?? '')
    }
    filterDirty = false
    activeQuery = ''
    if (filterable && inputRef) {
      filterText = ''
    }
    void tick().then(() => (inputRef ?? controlRef)?.focus())
  }

  // Shared commit tail: close the panel and hand focus back to the filterable
  // input (the option never receives focus, so the input keeps the caret).
  async function closeAndRestoreFocus(): Promise<void> {
    close()
    // Always restore focus for a filterable control: the option never receives
    // focus (aria-activedescendant), so the input keeps (or regains) the caret.
    if (filterable && inputRef !== null) {
      suppressOpenOnFocus = true
      await tick()
      inputRef?.focus()
      // `focus()` is a no-op when the input already holds focus, so no focus
      // event consumes the guard; clear it either way or the next real focus
      // would be swallowed and the panel would not reopen.
      suppressOpenOnFocus = false
    }
  }

  async function select(value: string) {
    const selectedOption = normalizedOptions.find(option => option.value === value)
    onSelect(value)
    if (filterable && selectedOption) {
      // A confirmed value spends the typed query: store the confirmed label as
      // the query so reopening filters by the value shown in the input rather
      // than reverting it to what was typed.
      filterText = selectedOption.label
      activeQuery = selectedOption.label
    }
    await closeAndRestoreFocus()
  }

  // Free entry: commit the typed text as the value even though it matches no
  // option. The input keeps showing the committed text (as `select` does with
  // a confirmed label), so reopening filters by it instead of reverting.
  async function commitCustomValue(text: string): Promise<void> {
    onSelect(text)
    if (filterable) {
      filterText = text
      activeQuery = text
    }
    await closeAndRestoreFocus()
  }

  // One keydown entry, dispatched by concern: type-ahead, range selection,
  // modified-key passthrough, listbox navigation, Escape, then Enter/commit.
  function handleControlKeydown(event: KeyboardEvent) {
    if (handleTypeahead(event)) {
      return
    }
    // A text-editing combo is starting: drop any pending caret fix so it
    // cannot collapse the selection the user is about to make.
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      caret.cancel()
    }
    if (handleRangeSelection(event)) {
      return
    }
    // Other modified navigation keys (Shift+Arrow, Ctrl/Meta+Arrow/Home/End)
    // belong to the text field; let the browser handle them. Plain keys still
    // drive the listbox.
    if (isModifiedNavKey(event)) {
      return
    }
    if (handleListboxNavigation(event)) {
      return
    }
    if (event.key === 'Escape') {
      // A focused but closed control owns no window-level Escape listener
      // (`useDropdown` only listens while open), so drop focus here directly.
      // In a dialog the dialog's own capture handler runs first and still
      // cancels, exactly as before.
      blurControl()
      return
    }
    if (event.key === 'Enter') {
      handleEnter(event)
    }
  }

  // The non-filterable trigger has no text field: a printable key runs
  // type-ahead (commit the first label match) and consuming it here keeps the
  // rest of the navigation untouched.
  function handleTypeahead(event: KeyboardEvent): boolean {
    if (filterable || !listbox.handleTypeahead(event)) {
      return false
    }
    event.preventDefault()
    return true
  }

  // Shift+Home / Shift+End select text. Drive the range explicitly rather than
  // relying on the browser default: a browser that select-alls on focus leaves
  // the anchor at the start, so a native Shift+Home would collapse the
  // selection instead of extending it. The control keeps the caret at the end,
  // so Shift+Home selects the whole value and Shift+End collapses it.
  function handleRangeSelection(event: KeyboardEvent): boolean {
    if (!inputRef || !event.shiftKey) {
      return false
    }
    if (event.key === 'Home') {
      event.preventDefault()
      inputRef.setSelectionRange(0, inputRef.value.length, 'backward')
      return true
    }
    if (event.key === 'End') {
      event.preventDefault()
      const end = inputRef.value.length
      inputRef.setSelectionRange(end, end)
      return true
    }
    return false
  }

  function handleListboxNavigation(event: KeyboardEvent): boolean {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        flushSync(() => {
          openPanel()
        })
        return true
      }
      listbox.moveHighlight('down')
      return true
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        flushSync(() => {
          openPanel()
          listbox.selection.move('last', filteredOptions.length)
        })
        return true
      }
      listbox.moveHighlight('up')
      return true
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (open && filteredOptions.length > 0) {
        event.preventDefault()
        listbox.moveHighlight(event.key === 'Home' ? 'first' : 'last')
      }
      return true
    }
    return false
  }

  function handleEnter(event: KeyboardEvent) {
    if (!open) {
      // Enter on the closed control reopens the panel, so a value that was just
      // confirmed can be changed again without reaching for the mouse.
      event.preventDefault()
      flushSync(() => {
        openPanel()
      })
      return
    }
    event.preventDefault()
    // Free entry: typed text that matches no option commits as a custom value
    // instead of falling back to the highlighted row. The match is
    // case-insensitive like filtering, so `TWO` still selects `Two` instead of
    // committing a duplicate. Pristine text (the echoed value, never edited)
    // never commits — without this, Enter on a freshly opened panel would
    // commit the current label as new.
    const customText = filterText.trim()
    const customLower = customText.toLowerCase()
    const exactMatch = normalizedOptions.some(
      option => option.label.toLowerCase() === customLower || option.value.toLowerCase() === customLower,
    )
    if (allowCustomValue && filterable && filterDirty && customText !== '' && !exactMatch) {
      void commitCustomValue(customText)
      return
    }
    const option = filteredOptions[listbox.selection.index] ?? filteredOptions[0]
    if (option) {
      void select(option.value)
    }
  }
  const listbox = useListbox({
    isOpen: () => open,
    onClose: close,
    openPanel,
    options: () => filteredOptions,
    optionLabel: option => option.label,
    getContainer: () => containerRef,
    getPanel: () => panelRef,
    getOptionEl: index => optionEls[index],
    typeahead: true,
    onOutsideClick: close,
    onEscape: () => {
      // Blurring fires the focusout path, which closes the panel and resets
      // a dirty filter through the `!open` effect, so Escape both reverts
      // and drops focus in one step.
      close()
      blurControl()
    },
    onScrollClose: close,
  })
</script>

<div
  class="relative"
  bind:this={containerRef}
  data-escape-capture={open ? '' : null}
  onfocusout={listbox.handleFocusOut}>
  {#snippet triggerChevron()}
    <ChevronDownIcon size={affordanceSize} className="shrink-0 text-slate-400" />
  {/snippet}
  {#snippet fieldChevron()}
    <!-- The filterable trigger's trailing adornment: the field frame stretches
         to the trigger box, so `right-0` holds the box's own right edge. -->
    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center">
      {@render triggerChevron()}
    </span>
  {/snippet}
  {#snippet triggerControl()}
    {#if filterable}
      <label class={resolvedControlClass} style={resolvedControlStyle}>
        {#if leading}{@render leading()}{/if}
        <TextInput
          bind:inputRef
          bind:value={filterText}
          {size}
          role="combobox"
          {ariaLabel}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-activedescendant={open && filteredOptions[listbox.selection.index]
            ? `${panelId}-option-${listbox.selection.index}`
            : undefined}
          onfocus={handleControlFocus}
          onblur={handleControlBlur}
          onclick={handleControlClick}
          ondblclick={handleControlDblClick}
          oninput={handleControlInput}
          onkeydown={handleControlKeydown}
          variant="embedded"
          className={`field-sizing-content min-w-0 text-left ${filterInputGutter}`}
          wrapperStyle={filterFrameStyle}
          trailing={fieldChevron} />
      </label>
    {:else}
      <button
        type="button"
        bind:this={controlRef}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-activedescendant={open && filteredOptions[listbox.selection.index]
          ? `${panelId}-option-${listbox.selection.index}`
          : undefined}
        onclick={toggle}
        onkeydown={handleControlKeydown}
        class={resolvedButtonClass}
        style={resolvedButtonStyle}>
        {#if leading}{@render leading()}{/if}
        <!-- The label row keeps the line height even with an empty label (a
             cleared value), so clearing the selection never trims the trigger. -->
        <span class="min-h-[var(--input-line)] min-w-0 flex-1 truncate">{resolvedButtonLabel}</span>
        {@render triggerChevron()}
      </button>
    {/if}
  {/snippet}
  {#snippet closeIcon()}
    <CloseIcon />
  {/snippet}
  {#if showClear || trailer}
    <!-- The trigger row hosts the clear affordance and/or a caller trailer
      after the trigger; its gap is a ratio of the size. The clear affordance's
      icon box rides the trimmed affordance size, so it scales with the
      control. -->
    <span class="inline-flex items-center" style={`gap:${selectMetrics.gap}px`}>
      {@render triggerControl()}
      {#if showClear}
        <Button
          variant="ghost"
          size={affordanceSize}
          icon={closeIcon}
          ariaLabel={resolvedClearLabel}
          onClick={handleClear} />
      {/if}
      {#if trailer}{@render trailer()}{/if}
    </span>
  {:else}
    {@render triggerControl()}
  {/if}
  {#if open}
    <ListboxPanel
      bind:panelEl={panelRef}
      id={panelId}
      {ariaLabel}
      panelClass={`fixed top-0 left-0 z-40 will-change-transform ${resolvedPanelClass}`}
      optionRowClass={resolvedOptionRowClass}
      optionRowStyle={resolvedOptionRowStyle}
      options={filteredOptions}
      highlightFlags={listbox.highlight.flags}
      isActive={option => option.value === activeValue}
      onSelect={option => void select(option.value)}
      onActivate={index => {
        if (listbox.selection.peek() !== index) listbox.selection.set(index)
      }}
      {setOptionEl}
      getTrigger={() => containerRef}
      getOpen={() => open}
      {align}
      {autoPlace}
      {emptyLabel}
      emptyRowClass={resolvedEmptyRowClass}
      emptyRowStyle={resolvedEmptyRowStyle}
      activeClass="bg-slate-800 text-cyan-200"
      idleClass="text-slate-300"
      labelOf={option => option.label}
      matchParts={option => labelParts(option.label)} />
  {/if}
</div>
