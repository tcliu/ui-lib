// The one base text-field chrome shared by every text-like input. `TextInput`
// renders the canonical `<input>`; `PasswordInput`/`SearchInput`/`NumberInput`
// compose it, and `TextArea` imports these directly because a `<textarea>` cannot
// compose an `<input>`. Keep the chrome here so no input re-declares it.
import { FONT_RATIO } from '#lib/size-scale.js'

// The border and the focus color that accompanies it; a field embedded in
// another surface drops both together (see `INPUT_EMBEDDED`).
const INPUT_BORDER = 'border border-slate-700 focus:border-cyan-500'

// Surface, text, placeholder, disabled, read-only, and motion, shared by the
// bordered chrome.
const INPUT_SURFACE =
  'w-full bg-slate-950 text-slate-100 transition outline-none placeholder:text-slate-500 disabled:opacity-40 read-only:cursor-default read-only:text-slate-400 motion-reduce:transition-none'

// The canonical bordered chrome.
export const INPUT_CHROME = `${INPUT_BORDER} ${INPUT_SURFACE}`

// The bordered chrome without its outline: the surface and text rules stay,
// while the border and its focus color drop, for a field that sits inside a
// caller-owned row without drawing a second box.
export const INPUT_CHROME_NO_OUTLINE = INPUT_SURFACE

// The chrome of a field embedded in another surface (a tag row, a select
// trigger, a stepper-less numeric field): the container owns the border, the
// background, and the focus ring, so the field drops all three and keeps only
// what it owns. The text rules (color, placeholder, disabled) belong to the
// field, so the caller adds them.
export const INPUT_EMBEDDED = 'bg-transparent outline-none'

// The text and vertical box metrics every text-like box shares: font, line, and
// vertical padding. A box that draws its own asymmetric horizontal inset (a
// select trigger reserving a chevron gutter) composes this with its own
// `pl`/`pr` instead of the symmetric padding below.
export const INPUT_TEXT_METRIC_CLASS =
  'py-[var(--input-pad-y)] text-[length:var(--input-font)] leading-[var(--input-line)]'

// The symmetric horizontal padding of a full field.
export const INPUT_PAD_X_CLASS = 'px-[var(--input-pad-x)]'

// The radius of a full field. The fallback keeps the class usable on its own
// (an exported trigger class consumed outside a styled field) at the `md` step;
// the emitted var wins wherever a sized field renders.
export const INPUT_RADIUS_CLASS = 'rounded-[var(--input-radius,0.375rem)]'

// The `--input-*` metric classes for a full text field; the size-metric custom
// properties they consume are set inline by the component.
export const INPUT_METRIC_CLASS =
  `${INPUT_RADIUS_CLASS} ${INPUT_TEXT_METRIC_CLASS} ${INPUT_PAD_X_CLASS}`

// The line box's leading over the label: the tuned 19px line at 13px text.
// `line` derives from `font` through this share, so retuning the shared font
// carries every field's row height with it instead of leaving a fixed line box
// behind. Derived, not a separate ratio, per the size-metric rule.
export const INPUT_LEADING = 19 / 13

// Every metric is a fixed ratio of the size dimension, so each keeps a constant
// metric:dimension ratio across the whole range. The font is the shared text
// ratio (`FONT_RATIO`), so every text surface stays at one label size.
//
// The tunable set is `FIELD_RATIOS`: the text metrics a field's `ratios` prop
// may override. `line` is deliberately absent — it derives from `font` through
// `INPUT_LEADING` at each field, so a font override carries the row height
// instead of leaving a fixed line box behind.
export const FIELD_RATIOS = { font: FONT_RATIO, radius: 0.375, padX: 0.5625, padY: 0.39375 }

// The resolved chrome ratios: the tunable set plus the derived line box, for
// consumers that read a resolved line (the display label, the select trigger,
// the pager) rather than deriving their own.
export const INPUT_RATIOS = { ...FIELD_RATIOS, line: FIELD_RATIOS.font * INPUT_LEADING }

export type FieldRatios = typeof FIELD_RATIOS
// A caller's override is partial: omitted keys keep the shared defaults.
export type FieldRatioOverrides = Partial<FieldRatios>
