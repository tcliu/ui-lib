<script lang="ts">
  import Menu, { type MenuItemState } from '#lib/components/Menu.svelte'
  import { LOCALES, getI18nContext } from '#lib/i18n/store.svelte.js'
  import GlobeIcon from '#lib/icons/GlobeIcon.svelte'
  import { menuRadioItemClass } from './menu-item-class'

  const i18n = getI18nContext()

  interface Props {
    align?: 'left' | 'right'
    autoPlace?: boolean
  }

  type LocaleOption = (typeof LOCALES)[number]

  let { align = 'left', autoPlace = true }: Props = $props()

  function itemClass(option: LocaleOption, state: MenuItemState): string {
    return menuRadioItemClass(state, option.code === i18n.locale)
  }
</script>

<Menu
  items={[...LOCALES]}
  itemKey={option => option.code}
  onSelect={index => i18n.setLocale(LOCALES[index].code)}
  ariaLabel={i18n.t('showcase.language')}
  {align}
  {autoPlace}
  itemRole="menuitemradio"
  itemChecked={option => i18n.locale === option.code}
  phoneSheetTitle={i18n.t('showcase.language')}
  closeLabel={i18n.t('common.close')}
  {itemClass}>
  {#snippet icon()}
    <GlobeIcon />
  {/snippet}
  {#snippet item(option: LocaleOption, _state: MenuItemState)}
    <span>{option.label}</span>
  {/snippet}
</Menu>
