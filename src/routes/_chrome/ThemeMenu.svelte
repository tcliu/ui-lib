<script lang="ts">
  import Menu, { type MenuItemState } from '#lib/components/Menu.svelte'
  import { getI18nContext } from '#lib/i18n/store.svelte.js'
  import { getTheme, setTheme, THEMES, type UiTheme } from '#appLib/state/theme.svelte.js'
  import PaletteIcon from '#lib/icons/PaletteIcon.svelte'
  import { menuRadioItemClass } from './menu-item-class'
  import { THEME_ICONS } from './theme-icons'

  const i18n = getI18nContext()
  const currentTheme = $derived(getTheme())

  interface Props {
    align?: 'left' | 'right'
    autoPlace?: boolean
  }

  let { align = 'left', autoPlace = true }: Props = $props()

  function themeLabel(theme: UiTheme): string {
    return theme.charAt(0).toUpperCase() + theme.slice(1)
  }

  const themeOptions = $derived(THEMES.map(value => ({ value, label: themeLabel(value) })))

  type ThemeOption = (typeof themeOptions)[number]

  function itemClass(option: ThemeOption, state: MenuItemState): string {
    return menuRadioItemClass(state, option.value === currentTheme)
  }
</script>

<Menu
  items={themeOptions}
  itemKey={option => option.value}
  onSelect={index => setTheme(themeOptions[index].value)}
  ariaLabel={i18n.t('showcase.theme')}
  {align}
  {autoPlace}
  itemRole="menuitemradio"
  itemChecked={option => option.value === currentTheme}
  phoneSheetTitle={i18n.t('showcase.theme')}
  closeLabel={i18n.t('common.close')}
  {itemClass}>
  {#snippet icon()}
    <PaletteIcon />
  {/snippet}
  {#snippet item(option: ThemeOption, _state: MenuItemState)}
    {@const OptionIcon = THEME_ICONS[option.value]}
    <span class="flex min-w-0 items-center gap-2">
      <OptionIcon className="shrink-0" />
      <span>{option.label}</span>
    </span>
  {/snippet}
</Menu>
