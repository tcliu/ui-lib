import MoonIcon from '#lib/icons/MoonIcon.svelte'
import FireIcon from '#lib/icons/FireIcon.svelte'
import ForestIcon from '#lib/icons/ForestIcon.svelte'
import GlobeIcon from '#lib/icons/GlobeIcon.svelte'
import MidnightIcon from '#lib/icons/MidnightIcon.svelte'
import SparklesIcon from '#lib/icons/SparklesIcon.svelte'
import SunIcon from '#lib/icons/SunIcon.svelte'
import MintIcon from '#lib/icons/MintIcon.svelte'
import LightBulbIcon from '#lib/icons/LightBulbIcon.svelte'
import LavenderIcon from '#lib/icons/LavenderIcon.svelte'
import CloudIcon from '#lib/icons/CloudIcon.svelte'
import type { UiTheme } from '#appLib/state/theme.svelte.js'

// One glyph per theme, so the picker's rows pair an icon with their label. The
// `Record<UiTheme, …>` type makes a missing theme a compile error rather than a
// row that silently renders a bare label.
export const THEME_ICONS: Record<UiTheme, typeof MoonIcon> = {
  dark: MoonIcon,
  light: SunIcon,
  ember: FireIcon,
  sepia: LightBulbIcon,
  nebula: SparklesIcon,
  graphite: GlobeIcon,
  forest: ForestIcon,
  plum: MidnightIcon,
  mint: MintIcon,
  olive: CloudIcon,
  lavender: LavenderIcon,
}
