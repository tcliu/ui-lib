<script module lang="ts">
  import { TEXT_INPUT_RATIOS } from './text-input-metrics'

  // The field's ratios plus the visibility toggle's own metrics, so one partial
  // object tunes the whole control.
  export const PASSWORD_INPUT_RATIOS = {
    ...TEXT_INPUT_RATIOS,
    icon: 1,
    box: 2.25,
    inset: 0.25,
  }
  export type PasswordInputRatios = typeof PASSWORD_INPUT_RATIOS
  export type PasswordInputRatioOverrides = Partial<PasswordInputRatios>
</script>

<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import Button from './Button.svelte'
  import TextInput from './TextInput.svelte'
  import EyeIcon from '$lib/icons/EyeIcon.svelte'
  import EyeSlashIcon from '$lib/icons/EyeSlashIcon.svelte'
  import { getI18nContext } from '$lib/i18n/store.svelte'
  import type { SizeInput } from '$lib/size-scale'
  import type { TextInputRatioOverrides } from './text-input-metrics'
  import { dimensionMetrics, sizeVarStyle } from './size-metrics'
  import type { ClearableProps } from './clearable-props'
  const i18n = getI18nContext()

  interface Props extends ClearableProps {
    value: string
    // Baseline the clear affordance compares against; forwarded to TextInput,
    // whose fallback clear writes it back.
    defaultValue?: string
    id?: string
    name?: string
    placeholder?: string
    autocomplete?: HTMLInputAttributes['autocomplete']
    disabled?: boolean
    required?: boolean
    showLabel?: string
    hideLabel?: string
    size?: SizeInput
    // Partial override of the field and toggle metric ratios; omitted keys keep
    // the shared defaults.
    ratios?: PasswordInputRatioOverrides
    className?: string
    // Forwarded to TextInput: drop the field's border and focus border while
    // keeping its surface, metrics, and text rules.
    hideOutline?: boolean
    // The visibility toggle owns the field's right edge, so `clearPlacement`
    // `auto` renders the clear outside the input.
    oninput?: (event: Event) => void
  }

  let {
    value = $bindable(),
    defaultValue,
    id,
    name,
    placeholder,
    autocomplete = 'current-password',
    disabled = false,
    required = false,
    showLabel,
    hideLabel,
    size = 'md',
    ratios,
    className = '',
    hideOutline = false,
    clearable = false,
    clearLabel,
    clearPlacement = 'auto',
    onClear,
    oninput,
  }: Props = $props()

  const resolvedRatios = $derived({ ...PASSWORD_INPUT_RATIOS, ...ratios })
  // The input box rides TextInput's shared base metrics; only the toggle's
  // icon needs its own metric, scaled by the same dimension.
  const pwdMetrics = $derived(
    dimensionMetrics(size, {
      icon: resolvedRatios.icon,
      box: resolvedRatios.box,
      inset: resolvedRatios.inset,
    }),
  )
  const pwdStyle = $derived(sizeVarStyle('pwd', pwdMetrics))
  const fieldRatios: TextInputRatioOverrides = $derived({
    font: resolvedRatios.font,
    radius: resolvedRatios.radius,
    padX: resolvedRatios.padX,
    padY: resolvedRatios.padY,
    clearButton: resolvedRatios.clearButton,
    clearGutter: resolvedRatios.clearGutter,
    clearBox: resolvedRatios.clearBox,
    trailerGap: resolvedRatios.trailerGap,
  })

  // The toggle overlays the field's right edge, so the input reserves that
  // gutter. A standalone literal the scanner can extract: glued to a `${`
  // interpolation inside the class expression, Tailwind never emitted it and
  // the password rendered under the button.
  const TOGGLE_GUTTER_CLASS = 'pr-[calc(var(--pwd-box)+var(--pwd-inset)*2)]'

  // Derived (not plain consts) so locale switches re-resolve the labels.
  const resolvedShowLabel = $derived(showLabel ?? i18n.t('password.show'))
  const resolvedHideLabel = $derived(hideLabel ?? i18n.t('password.hide'))

  let visible = $state(false)
  let input = $state<HTMLInputElement | null>(null)
  export function focus() {
    input?.focus()
  }

  function toggleVisibility() {
    // Changing `type` makes the browser reset the selection, so capture the
    // caret (or selected range) before the switch and put it back once the DOM
    // has updated: revealing the value must not move the user's place. The
    // toggle's `preventFocusSteal` keeps the field focused through the click.
    const selectionStart = input?.selectionStart
    const selectionEnd = input?.selectionEnd
    const selectionDirection = input?.selectionDirection
    visible = !visible
    requestAnimationFrame(() => {
      if (!input || selectionStart == null || selectionEnd == null) return
      input.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? undefined)
    })
  }
</script>

{#snippet toggleGlyph()}
  {#if visible}
    <EyeSlashIcon />
  {:else}
    <EyeIcon />
  {/if}
{/snippet}

<TextInput
  bind:value
  bind:inputRef={input}
  {id}
  {name}
  {placeholder}
  {autocomplete}
  {disabled}
  {required}
  {size}
  ratios={fieldRatios}
  type={visible ? 'text' : 'password'}
  {hideOutline}
  {oninput}
  {defaultValue}
  {clearable}
  {clearLabel}
  {clearPlacement}
  {onClear}
  className={[TOGGLE_GUTTER_CLASS, className].filter(Boolean).join(' ')}
  wrapperStyle={pwdStyle}>
  {#snippet trailing()}
    <!-- The shared Button owns the glyph, the tooltip trigger (which also works
         while disabled, through its wrapper), and the pointer-down focus guard:
         clicking the eye keeps focus in the field when it was already there. -->
    <span class="absolute inset-y-0 right-[var(--pwd-inset)] flex items-center">
      <Button
        variant="ghost"
        size={pwdMetrics.icon}
        icon={toggleGlyph}
        ariaLabel={visible ? resolvedHideLabel : resolvedShowLabel}
        tooltip={visible ? resolvedHideLabel : resolvedShowLabel}
        {disabled}
        preventFocusSteal
        onClick={toggleVisibility}
        className="w-[var(--pwd-box)]" />
    </span>
  {/snippet}
</TextInput>
