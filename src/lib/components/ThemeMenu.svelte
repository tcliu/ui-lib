<script lang="ts">
  import Menu, { type MenuItemState } from './Menu.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import { getTheme, setTheme, THEMES, type UiTheme } from '$lib/theme.svelte'
  import PaletteIcon from '$lib/icons/PaletteIcon.svelte'

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
    return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none transition-none ${
      state.disabled
        ? 'cursor-not-allowed text-slate-600'
        : state.active
          ? 'bg-slate-800 text-cyan-200'
          : option.value === currentTheme
            ? 'text-cyan-200'
            : 'text-slate-300'
    }`
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
  triggerClass="p-1.5 relative before:absolute before:-inset-1.5 before:content-['']"
  phoneSheetTitle={i18n.t('showcase.theme')}
  closeLabel={i18n.t('common.close')}
  {itemClass}>
  {#snippet icon()}
    <PaletteIcon className="h-4 w-4" />
  {/snippet}
  {#snippet item(option: ThemeOption, _state: MenuItemState)}
    <span>{option.label}</span>
  {/snippet}
</Menu>
