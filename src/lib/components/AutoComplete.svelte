<script lang="ts">
  import { flushSync, tick } from 'svelte'
  import { useListbox } from '$lib/actions/use-listbox.svelte'
  import { createOptionIndex, matchesOption, matchLabelParts } from '$lib/actions/option-index'
  import { isModifiedNavKey } from '$lib/actions/listbox-keynav'
  import type { SizeInput } from '$lib/size-scale'
  import type { DropdownPanelProps } from '$lib/dropdown-chrome'
  import TextInput from './TextInput.svelte'
  import ListboxPanel from './ListboxPanel.svelte'
  import {
    DEFAULT_PANEL_CLASS,
    SELECT_BOX_UTILITIES,
    SELECT_RATIOS,
    OPTION_BASE,
  } from './select-dropdown-styles'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import type { SelectOption } from './SelectDropdown.svelte'
  import type { ClearableProps } from './clearable-props'

  // Accepted option shape, shared with `SelectDropdown`: a bare string is its
  // own label, and a missing label falls back to the value.
  interface NormalizedOption {
    value: string
    label: string
  }

  interface Props extends DropdownPanelProps, ClearableProps {
    // The live input text (bindable). Free-typed text persists; picking an
    // option writes that option's label here.
    value: string
    // Baseline the clear affordance compares against; forwarded to TextInput,
    // whose fallback clear writes it back.
    defaultValue?: string
    options: SelectOption[]
    // Called with the chosen option's `value` when an option is picked (a
    // notification, not the source of truth — `value` stays the display text).
    onSelect?: (value: string) => void
    ariaLabel?: string
    placeholder?: string
    size?: SizeInput
    inputRef?: HTMLInputElement | null
    disabled?: boolean
  }

  let {
    value = $bindable(),
    defaultValue,
    options,
    onSelect,
    ariaLabel,
    placeholder,
    size = 'md',
    inputRef = $bindable(null),
    disabled = false,
    clearable = false,
    clearLabel,
    clearPlacement = 'auto',
    onClear,
    align = 'left',
    autoPlace = true,
    panelClass,
  }: Props = $props()

  let id = $props.id()
  const panelId = `${id}-panel`

  // Normalize once per options array so every row and the filter read one shape.
  const normalizedOptions = $derived(
    options.map((option): NormalizedOption =>
      typeof option === 'string'
        ? { value: option, label: option }
        : { value: option.value, label: option.label ?? option.value },
    ),
  )

  // Lowercased once per options array (shared helper) so filtering does not
  // re-lowercase every label/value on every keystroke.
  const optionIndex = $derived(createOptionIndex(normalizedOptions))

  // The lowercased filter needle. Unlike `SelectDropdown`, the input text is
  // the model itself, so there is no "prefilled echo" to strip — the whole
  // value is the query.
  const filterQuery = $derived(value.trim().toLowerCase())

  // Matches only: a query that matches nothing yields an empty list (and the
  // panel hides) instead of falling back to every option, so accepting
  // a suggestion never picks an unrelated first row.
  const filteredOptions = $derived.by(() => {
    if (filterQuery === '') {
      return normalizedOptions
    }
    const matched: NormalizedOption[] = []
    for (const entry of optionIndex) {
      if (matchesOption(entry, filterQuery)) {
        matched.push(entry.option)
      }
    }
    return matched
  })

  // Emphasize the typed part of each label only while the query is ambiguous:
  // with two or more matches the user needs to see which part matched.
  const highlightMatches = $derived(filterQuery !== '' && filteredOptions.length > 1)

  function labelParts(label: string) {
    return highlightMatches ? matchLabelParts(label, filterQuery) : null
  }

  // The option panel is the shared `SelectDropdown` chrome: its rows consume
  // the same `--sel-*` box metrics, so both surfaces read alike.
  const panelMetrics = $derived(dimensionMetrics(size, SELECT_RATIOS))
  const panelStyle = $derived(sizeVarStyle('sel', panelMetrics))

  const resolvedPanelClass = $derived(panelClass ?? DEFAULT_PANEL_CLASS)
  const resolvedOptionRowClass = $derived(`${SELECT_BOX_UTILITIES} ${OPTION_BASE}`)

  let open = $state(false)
  // The panel hides when nothing matches: no listbox, no empty row.
  const showPanel = $derived(open && filteredOptions.length > 0)
  let containerRef = $state<HTMLDivElement | null>(null)
  let panelRef = $state<HTMLDivElement | null>(null)
  // Option elements by index, registered by the shared panel so the listbox
  // core can reveal the active row (never queried from the DOM).
  let optionEls = $state<(HTMLElement | null)[]>([])

  function setOptionEl(index: number, el: HTMLElement | null): void {
    optionEls[index] = el
  }

  // `listbox` is created below; these effects run after setup, so the forward
  // reference is safe.
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

  // A query that matches nothing hides the panel; typing back to a match
  // reopens it through the input handler.
  $effect(() => {
    if (open && filteredOptions.length === 0) {
      close()
    }
  })

  function close() {
    open = false
  }

  function openPanel() {
    if (filteredOptions.length === 0) {
      open = false
      return
    }
    lastFilteredOptions = filteredOptions
    // Highlight the option matching the current text on open; hover/arrows move
    // from there.
    listbox.selection.syncToActive(filteredOptions, option => option.label === value)
    open = true
    // A long list would otherwise open with the highlighted row scrolled out of
    // sight (the option never receives focus). Reveal after the flush, once
    // `positionPanel` has portaled and shown the panel.
    void tick().then(() => listbox.revealActive())
  }

  function handleFocus() {
    if (!open) {
      openPanel()
    }
  }

  function handleClick() {
    if (!open) {
      openPanel()
    }
  }

  function handleInput() {
    // Read the element's own value so the open filter is fresh even if the
    // `bind:value` write has not landed in this handler's turn yet.
    const next = inputRef?.value
    if (next !== undefined && next !== value) {
      value = next
    }
    if (!open) {
      openPanel()
    }
  }

  function select(option: NormalizedOption) {
    value = option.label
    onSelect?.(option.value)
    close()
  }

  function handleKeydown(event: KeyboardEvent) {
    // Modified navigation keys belong to the text field (Shift+Arrow selects,
    // Ctrl+Arrow moves by word); plain keys drive the listbox.
    if (isModifiedNavKey(event)) {
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        flushSync(() => {
          openPanel()
        })
        return
      }
      listbox.moveHighlight('down')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        flushSync(() => {
          openPanel()
          listbox.selection.move('last', filteredOptions.length)
        })
        return
      }
      listbox.moveHighlight('up')
    } else if (event.key === 'Home' || event.key === 'End') {
      if (open && filteredOptions.length > 0) {
        event.preventDefault()
        listbox.moveHighlight(event.key === 'Home' ? 'first' : 'last')
      }
    } else if (event.key === 'Enter') {
      // Accept the active suggestion only while the panel is open; a closed
      // field lets Enter reach the surrounding form.
      if (open) {
        const option = filteredOptions[listbox.selection.index]
        if (option) {
          event.preventDefault()
          select(option)
        }
      }
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
    // A text field filters natively; type-ahead is for button triggers only.
    typeahead: false,
    onOutsideClick: close,
    // Escape closes the panel but keeps focus and the typed text. The shared
    // window-level capture consumes the event, so an ancestor dialog stays open.
    onEscape: () => {
      close()
    },
    onScrollClose: close,
  })
</script>

<div class="relative" bind:this={containerRef} onfocusout={listbox.handleFocusOut}>
  <TextInput
    bind:value
    bind:inputRef
    {disabled}
    {placeholder}
    {ariaLabel}
    {size}
    {defaultValue}
    {clearable}
    {clearLabel}
    {clearPlacement}
    {onClear}
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={showPanel}
    aria-controls={showPanel ? panelId : undefined}
    aria-activedescendant={showPanel && filteredOptions[listbox.selection.index]
      ? `${panelId}-option-${listbox.selection.index}`
      : undefined}
    onfocus={handleFocus}
    onclick={handleClick}
    oninput={handleInput}
    onkeydown={handleKeydown}>
  </TextInput>
  {#if showPanel}
    <ListboxPanel
      bind:panelEl={panelRef}
      id={panelId}
      ariaLabel={ariaLabel}
      panelClass={`fixed top-0 left-0 z-40 will-change-transform ${resolvedPanelClass}`}
      optionRowClass={resolvedOptionRowClass}
      optionRowStyle={panelStyle}
      options={filteredOptions}
      highlightFlags={listbox.highlight.flags}
      isActive={option => option.label === value}
      onSelect={option => select(option)}
      onActivate={index => {
        if (listbox.selection.peek() !== index) listbox.selection.set(index)
      }}
      setOptionEl={setOptionEl}
      getTrigger={() => containerRef}
      getOpen={() => showPanel}
      {align}
      {autoPlace}
      activeClass="bg-slate-800 text-cyan-200"
      idleClass="text-slate-300"
      labelOf={option => option.label}
      matchParts={option => labelParts(option.label)} />
  {/if}
</div>
