<script lang="ts">
  import { onDestroy, tick, untrack } from 'svelte'
  import Button from './Button.svelte'
  import Tooltip from './Tooltip.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'
  import EditIcon from '$lib/icons/EditIcon.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import { copyToClipboard } from './copy-to-clipboard'
  import { FIELD_RATIOS, INPUT_LEADING, INPUT_METRIC_CLASS, type FieldRatioOverrides } from './input-chrome'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import TextInput from './TextInput.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  const i18n = getI18nContext()

  // Text-field metrics follow TextInput's shared base chrome (`input-chrome.ts`
  // FIELD_RATIOS): every metric is a fixed ratio of the size dimension, so names
  // (axis aliases) and numbers scale continuously together.

  interface Props {
    text: string
    // Return false to reject the committed value (e.g. duplicate name);
    // the component then restores the previous text and keeps editing.
    onChange: (text: string) => void | boolean
    size?: SizeInput
    // Partial override of the label's and field's tunable ratios (font, radius,
    // and both paddings); omitted keys keep the shared defaults. The line box is
    // not an override: both derive it from `font`.
    ratios?: FieldRatioOverrides
    className?: string
    onActivate?: () => void
    // maximum width (in px) the editable input may expand to; the actual max
    // also clamps to the space between the label and the viewport's right edge.
    maxWidth?: number
    // When true, the display mode is wrapped in a Copyable so the text can
    // also be copied to the clipboard on hover.
    copyable?: boolean
  }

  let {
    text,
    onChange,
    size = 'md',
    ratios,
    className = 'text-slate-200',
    onActivate,
    maxWidth = 480,
    copyable = false,
  }: Props = $props()

  let editing = $state(false)
  let value = $state('')
  let cancelled = $state(false)
  let input = $state<HTMLInputElement | null>(null)
  let displayBtn = $state<HTMLButtonElement | null>(null)
  let editBtn = $state<HTMLElement | null>(null)
  let inputWidth = $state<number | null>(null)
  let computedMaxWidth = $state<number | null>(null)
  let clickTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleActivate() {
    if (editing || !onActivate) return
    clickTimer = setTimeout(() => onActivate(), 250)
  }

  function startEdit() {
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
    cancelled = false
    value = text
    // Measure the rendered label and edit-button widths so the input can
    // size to "label width + gap + edit icon width" when editing starts.
    // We measure before switching to edit mode because the display elements
    // are replaced when editing becomes true.
    try {
      const labelRect = displayBtn?.getBoundingClientRect()
      const editRect = editBtn?.getBoundingClientRect()
      const gapPx = 8 // Tailwind gap-2 is 0.5rem -> 8px at 16px root
      if (labelRect) {
        inputWidth = Math.ceil(labelRect.width + (editRect?.width ?? 0) + gapPx)
      } else {
        inputWidth = null
      }
      // Compute the remaining horizontal width so the editable input's max
      // width is the lesser of the `maxWidth` prop and the space to the right
      // of the label. The display row hugs its content (siblings sit right
      // after the label), so its own width says nothing about the space around
      // it; measure from the viewport's right edge instead. A narrower host
      // narrows the field through the `maxWidth` prop.
      try {
        if (labelRect) {
          // Reserve room for sibling action buttons (e.g. delete) + padding.
          const reserved = 48
          const viewportRight = document.documentElement.clientWidth
          const remaining = Math.max(0, Math.floor(viewportRight - labelRect.left - reserved))
          computedMaxWidth = Math.min(maxWidth, remaining)
        } else {
          computedMaxWidth = maxWidth
        }
      } catch (e) {
        computedMaxWidth = maxWidth
      }
    } catch (e) {
      inputWidth = null
    }
    editing = true
  }

  function handleTextDoubleClick(event: MouseEvent) {
    event.preventDefault()
    startEdit()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelled = true
      editing = false
    } else if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
  }

  function commit() {
    if (cancelled) return
    const next = value.trim()
    if (!next || next === text) {
      editing = false
      return
    }
    const accepted = onChange(next)
    if (accepted === false) {
      value = text
      return
    }
    editing = false
  }

  $effect(() => {
    if (!editing) return
    void tick().then(() => input?.focus())
  })

  // Auto-resize the input to fit its content while editing, but don't shrink
  // below the initially measured label+icon width and cap at a sensible max.
  // The probe width rides `$state`, so collapsing applies on the next flush and
  // the measurement waits for `tick()` before reading the laid-out width.
  async function measureInputWidth(field: HTMLInputElement, base: number, max: number): Promise<void> {
    // Account for the size-scaled horizontal padding (both sides); read before
    // the flush so a size change still re-runs this effect.
    const paddingExtra = metrics.padX * 2
    try {
      // Collapse the declarative width so scrollWidth reflects the content.
      inputWidth = 0
      await tick()
      if (!editing || input !== field) {
        return
      }
      const contentWidth = field.scrollWidth
      inputWidth = Math.min(max, Math.max(base, contentWidth + paddingExtra))
    } catch (e) {
      console.error('EditableText: width measurement failed', e)
    }
  }

  $effect(() => {
    if (!editing || !input) return
    // Depend on value so this effect runs as the user types.
    void value
    const field = input
    // The measured label+icon width is the floor; read it untracked so the
    // effect's own writes never reschedule it.
    const base = untrack(() => inputWidth) ?? 0
    const max = computedMaxWidth ?? maxWidth
    void measureInputWidth(field, base, max)
  })

  onDestroy(() => {
    if (clickTimer) clearTimeout(clickTimer)
  })

  // Text sizing follows TextInput: the shared input chrome (`input-chrome.ts`)
  // drives font, radius, and padding from the size dimension, emitted as
  // `--input-*` vars consumed by `INPUT_METRIC_CLASS` below. Both the label and
  // the edit field derive their line box from the font, so one font override
  // keeps them on one height.
  const resolvedRatios = $derived({ ...FIELD_RATIOS, ...ratios })
  const metrics = $derived(
    dimensionMetrics(size, {
      ...resolvedRatios,
      line: resolvedRatios.font * INPUT_LEADING,
    }),
  )
  const sizeStyle = $derived(sizeVarStyle('input', metrics))
  // The edit field rides the same metrics; TextInput derives its own line from
  // the font, so it takes only the tunable subset.
  const fieldRatios = $derived({
    font: resolvedRatios.font,
    radius: resolvedRatios.radius,
    padX: resolvedRatios.padX,
    padY: resolvedRatios.padY,
  })
  const metricClass = INPUT_METRIC_CLASS
  // The edit field rides TextInput, which emits the same `--input-*` vars for
  // the shared size, so the field needs only its measured width on top.
  const widthStyle = $derived(inputWidth === null ? 'min-width: 0' : `width: ${inputWidth}px; min-width: 0`)
</script>

{#if editing}
  <!-- In edit mode size the input to the measured label+icon width so
       sibling tag chips don't shift. Fallback to min-width only if we
       couldn't measure. -->
  <div class="flex min-w-0 items-center">
    <!-- The field rides TextInput, which owns the input element, the ref, and
         the size metrics. Its chrome stays EditableText's own — an outline
         ring standing in for the text — so it rides the base override, not the
         embedded variant: the embedded base drops the surface, and this field
         paints its own. -->
    <TextInput
      bind:inputRef={input}
      bind:value
      inputClass={`${metricClass} max-w-full bg-slate-950 text-slate-100 outline outline-1 outline-slate-700 transition focus:outline-cyan-500 motion-reduce:transition-none`}
      inputStyle={widthStyle}
      {size}
      ratios={fieldRatios}
      ariaLabel={i18n.t('edit.editText')}
      onclick={e => e.stopPropagation()}
      onkeydown={e => {
        e.stopPropagation()
        handleKeydown(e)
      }}
      onblur={commit}
      data-escape-capture />
  </div>
{:else}
  {#snippet displayContent()}
    <button
      bind:this={displayBtn}
      type="button"
      class={`${metricClass} min-w-0 truncate bg-transparent text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 motion-reduce:transition-none ${className}`}
      style={sizeStyle}
      onclick={e => {
        e.stopPropagation()
        scheduleActivate()
      }}
      onkeydown={e => {
        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
      }}
      ondblclick={handleTextDoubleClick}>
      {text}<Tooltip>{i18n.t('edit.doubleClickToEdit')}</Tooltip>
    </button>
    <span
      bind:this={editBtn}
      class="transition group-hover:opacity-100 focus-within:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:opacity-0">
      <Button
        variant="ghost"
        {size}
        ariaLabel={i18n.t('edit.edit')}
        tooltip={i18n.t('edit.edit')}
        onClick={e => {
          e.stopPropagation()
          startEdit()
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
        }}
        className="bg-transparent text-slate-400 hover:text-cyan-300">
        {#snippet icon()}
          <EditIcon />
        {/snippet}
      </Button>
    </span>
  {/snippet}

  <!-- Don't grow to fill the available space in display mode so sibling elements
       (e.g. tag chips) sit immediately after the filename instead of being
       pushed to the right. Keep min-w-0 so truncation still works.
       `items-center` centers the icon wrappers (edit + copy) on the text field's
       own vertical middle, so no nudge is needed to align them with the text. -->
  <div class="group flex min-w-0 items-center gap-2">
    {@render displayContent()}
    {#if copyable && text.trim() !== ''}
      <span class="shrink-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:opacity-0">
        <Button
          variant="ghost"
          {size}
          ariaLabel={i18n.t('common.copy')}
          tooltip={i18n.t('common.copy')}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            void copyToClipboard(text, {
              copied: i18n.t('editor.toast.copied'),
              failed: i18n.t('editor.toast.copyFailed'),
            })
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
          }}
          className="bg-transparent text-slate-400 hover:text-cyan-300">
          {#snippet icon()}
            <CopyIcon />
          {/snippet}
        </Button>
      </span>
    {/if}
  </div>
{/if}

<style>
  /* 16px on touch pointers so iOS Safari does not auto-zoom on focus, matching
     the guard on TextInput's field; it covers the display label too, so the
     label keeps the field's rendered size (the edit field carries the same
     guard inside TextInput). Plain scoped CSS on purpose: a stacked Tailwind
     variant inside a class expression never reaches the scanner, so it would
     silently not exist. */
  @media (pointer: coarse) {
    button {
      font-size: 1rem;
    }
  }
</style>
