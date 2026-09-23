<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { getI18nContext } from '$lib/i18n.svelte'
  import {
    APP_SHELL_DEFAULT_WIDTH,
    APP_SHELL_DESKTOP_BREAKPOINT,
    APP_SHELL_MAX_WIDTH,
    APP_SHELL_MIN_WIDTH,
    APP_SHELL_RAIL_WIDTH,
    resolveDrawerFloating,
    type AppShellCollapseMode,
    type AppShellDrawerMode,
  } from '$lib/app-shell'
  import Button from '$lib/components/Button.svelte'
  import Splitter from '$lib/components/Splitter.svelte'
  import MenuIcon from '$lib/icons/MenuIcon.svelte'
  import { AppShellDrawer } from './use-app-shell-drawer.svelte'

  interface Props {
    mode?: AppShellDrawerMode
    open?: boolean
    paneSize?: number
    collapseMode?: AppShellCollapseMode
    railWidth?: number
    min?: number
    max?: number
    defaultSize?: number
    storageKey?: string
    showToggle?: boolean
    toggleShowLabel?: string
    toggleHideLabel?: string
    resizeLabel?: string
    closeLabel?: string
    leftPaneLabel?: string
    rightPaneLabel?: string
    rightOpen?: boolean
    rightPaneSize?: number
    rightCollapseMode?: AppShellCollapseMode
    rightStorageKey?: string
    showRightToggle?: boolean
    rightToggleShowLabel?: string
    rightToggleHideLabel?: string
    rightResizeLabel?: string
    headerClassName?: string
    paneClassName?: string
    rightPaneClassName?: string
    mainClassName?: string
    splitterClassName?: string
    onOpenChange?: (open: boolean) => void
    onPaneChange?: (size: number) => void
    onDragEnd?: () => void
    onRightOpenChange?: (open: boolean) => void
    onRightPaneChange?: (size: number) => void
    onRightDragEnd?: () => void
    headerLeft?: Snippet
    headerRight?: Snippet
    leftPane?: Snippet
    rightPane?: Snippet
    children?: Snippet
  }

  let {
    mode = 'auto',
    open = $bindable(true),
    paneSize = $bindable(APP_SHELL_DEFAULT_WIDTH),
    collapseMode = 'hide',
    railWidth = APP_SHELL_RAIL_WIDTH,
    min = APP_SHELL_MIN_WIDTH,
    max = APP_SHELL_MAX_WIDTH,
    defaultSize = APP_SHELL_DEFAULT_WIDTH,
    storageKey = undefined,
    showToggle = true,
    toggleShowLabel = undefined,
    toggleHideLabel = undefined,
    resizeLabel = undefined,
    closeLabel = undefined,
    leftPaneLabel = undefined,
    rightPaneLabel = undefined,
    rightOpen = $bindable(false),
    rightPaneSize = $bindable(APP_SHELL_DEFAULT_WIDTH),
    rightCollapseMode = 'hide',
    rightStorageKey = undefined,
    showRightToggle = true,
    rightToggleShowLabel = undefined,
    rightToggleHideLabel = undefined,
    rightResizeLabel = undefined,
    headerClassName = '',
    paneClassName = '',
    rightPaneClassName = '',
    mainClassName = '',
    splitterClassName = '',
    onOpenChange = undefined,
    onPaneChange = undefined,
    onDragEnd = undefined,
    onRightOpenChange = undefined,
    onRightPaneChange = undefined,
    onRightDragEnd = undefined,
    headerLeft = undefined,
    headerRight = undefined,
    leftPane = undefined,
    rightPane = undefined,
    children = undefined,
  }: Props = $props()

  const i18n = getI18nContext()

  const showLabel = $derived(toggleShowLabel ?? i18n.t('appShell.showPane'))
  const hideLabel = $derived(toggleHideLabel ?? i18n.t('appShell.hidePane'))
  const toggleLabel = $derived(open ? hideLabel : showLabel)
  const resolvedResizeLabel = $derived(resizeLabel ?? i18n.t('appShell.resize'))
  const resolvedRightResizeLabel = $derived(rightResizeLabel ?? i18n.t('appShell.resizeRight'))
  const resolvedCloseLabel = $derived(closeLabel ?? i18n.t('appShell.closePane'))
  const resolvedLeftPaneLabel = $derived(leftPaneLabel ?? i18n.t('appShell.leftPane'))
  const resolvedRightPaneLabel = $derived(rightPaneLabel ?? i18n.t('appShell.rightPane'))
  const rightShowLabel = $derived(rightToggleShowLabel ?? i18n.t('appShell.showRightPane'))
  const rightHideLabel = $derived(rightToggleHideLabel ?? i18n.t('appShell.hideRightPane'))
  const rightToggleLabel = $derived(rightOpen ? rightHideLabel : rightShowLabel)

  // Desktop vs narrow is measured from the shell's own container (via
  // ResizeObserver below), not the viewport, so an embedded shell floats its
  // drawers when its space is narrow even on a wide screen. The default keeps
  // the server/first paint docked; the observer corrects it after mount.
  let reduceMotion = $state(false)
  let containerWidth = $state(APP_SHELL_DESKTOP_BREAKPOINT)
  let rootEl = $state<HTMLElement | null>(null)
  let mainEl = $state<HTMLElement | null>(null)
  const desktopLayout = $derived(containerWidth >= APP_SHELL_DESKTOP_BREAKPOINT)

  // Floating is global: both drawers share the presentation mode so the
  // overlay, backdrop, and dismissal behavior stay consistent. Rail collapse
  // is an in-flow affordance, so a rail pane opts out of auto-floating.
  const railMode = $derived(collapseMode === 'rail' || rightCollapseMode === 'rail')
  const floating = $derived(resolveDrawerFloating(mode, desktopLayout) && !(mode === 'auto' && railMode))
  const slideParams = $derived({
    axis: floating || desktopLayout ? 'x' : 'y',
    duration: reduceMotion ? 0 : 200,
  } as const)

  const leftDrawer: AppShellDrawer = new AppShellDrawer({
    getOpen: () => open,
    setOpen: value => (open = value),
    getSize: () => paneSize,
    setSize: value => (paneSize = value),
    notifyOpenChange: value => onOpenChange?.(value),
    notifySizeChange: value => onPaneChange?.(value),
    notifyDragEnd: () => onDragEnd?.(),
    collapseMode: () => collapseMode,
    railWidth: () => railWidth,
    min: () => min,
    max: () => max,
    defaultSize: () => defaultSize,
    storageKey: () => storageKey,
    floating: () => floating,
    // Fall back to the other open drawer, then the main column, so closing one
    // pane never drops focus onto an inert element.
    focusFallback: (): HTMLElement | null => (rightDrawer.floatingOpen ? rightDrawer.asideEl : mainEl),
  })
  const rightDrawer: AppShellDrawer = new AppShellDrawer({
    getOpen: () => rightOpen,
    setOpen: value => (rightOpen = value),
    getSize: () => rightPaneSize,
    setSize: value => (rightPaneSize = value),
    notifyOpenChange: value => onRightOpenChange?.(value),
    notifySizeChange: value => onRightPaneChange?.(value),
    notifyDragEnd: () => onRightDragEnd?.(),
    collapseMode: () => rightCollapseMode,
    railWidth: () => railWidth,
    min: () => min,
    max: () => max,
    defaultSize: () => defaultSize,
    storageKey: () => rightStorageKey,
    floating: () => floating,
    focusFallback: (): HTMLElement | null => (leftDrawer.floatingOpen ? leftDrawer.asideEl : mainEl),
  })

  const overlayOpen = $derived(leftDrawer.floatingOpen || rightDrawer.floatingOpen)

  onMount(() => {
    leftDrawer.restoreSize()
    rightDrawer.restoreSize()
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      reduceMotion = motionQuery.matches
    }
    syncMotion()
    motionQuery.addEventListener('change', syncMotion)
    // Measure once synchronously so the first hydrated frame already matches
    // the container, then track later resizes.
    if (rootEl) {
      containerWidth = rootEl.clientWidth > 0 ? rootEl.clientWidth : APP_SHELL_DESKTOP_BREAKPOINT
    }
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0
      containerWidth = width > 0 ? width : APP_SHELL_DESKTOP_BREAKPOINT
    })
    if (rootEl) {
      resizeObserver.observe(rootEl)
    }
    return () => {
      motionQuery.removeEventListener('change', syncMotion)
      resizeObserver.disconnect()
    }
  })

  function handleBackdropClick() {
    if (rightDrawer.floatingOpen) {
      rightDrawer.setOpen(false)
    }
    if (leftDrawer.floatingOpen) {
      leftDrawer.setOpen(false)
    }
  }

  function handleDrawerEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || !overlayOpen) {
      return
    }
    // Cooperative dismissal: BaseDialog handles Escape in the capture phase
    // and stops propagation, so this bubble listener runs only when no dialog
    // consumed the key. Mark it consumed with preventDefault so the toast
    // listener on window does not also dismiss, then close the drawer the user
    // is interacting with, else the right one.
    event.preventDefault()
    const target = event.target
    const inRight = target instanceof Element && (rightDrawer.asideEl?.contains(target) ?? false)
    const inLeft = target instanceof Element && (leftDrawer.asideEl?.contains(target) ?? false)
    if (inRight && rightDrawer.floatingOpen) {
      rightDrawer.setOpen(false)
    } else if (inLeft && leftDrawer.floatingOpen) {
      leftDrawer.setOpen(false)
    } else if (rightDrawer.floatingOpen) {
      rightDrawer.setOpen(false)
    } else {
      leftDrawer.setOpen(false)
    }
  }
</script>

{#snippet drawerPane(
  drawer: AppShellDrawer,
  pane: Snippet | undefined,
  side: 'left' | 'right',
  label: string,
  paneLabel: string,
  paneClass: string,
)}
  <!-- One wrapper for both presentations: switching docked <-> floating only
    changes classes, so the pane never remounts (which would leave a stale
    outro copy alongside the new pane during the transition). -->
  <div
    in:slide={slideParams}
    out:slide={slideParams}
    data-drawer-presentation={floating ? 'floating' : 'docked'}
    class={`flex min-h-0 min-w-0 ${
      floating
        ? `absolute inset-y-0 z-20 w-[var(--pane-w)] max-w-[calc(100%-3rem)] ${side === 'right' ? 'right-0' : 'left-0'}`
        : 'flex-col md:flex-row'
    }`}
    style={`--pane-w: ${drawer.effectiveSize}px`}>
    {#if !floating && side === 'right'}
      <Splitter
        orientation="vertical"
        className={`hidden md:block ${splitterClassName}`}
        value={drawer.effectiveSize}
        min={drawer.splitterMin}
        {max}
        ariaLabel={label}
        onChange={next => drawer.changeSize(next)}
        onDragEnd={() => drawer.save()} />
    {/if}
    <aside
      bind:this={drawer.asideEl}
      class={`flex min-h-0 flex-col gap-2 border-slate-800 ${
        floating
          ? `w-full bg-slate-950 ${side === 'right' ? 'border-l' : 'border-r'}`
          : `border-b md:shrink-0 md:border-b-0 ${side === 'right' ? 'md:border-l' : 'md:border-r'}`
      } ${paneClass}`}
      style="flex-basis: var(--pane-w)"
      aria-label={paneLabel}
      tabindex="-1">
      {@render pane?.()}
    </aside>
    {#if !floating}
      {#if side === 'left'}
        <Splitter
          orientation="vertical"
          className={`hidden md:block ${splitterClassName}`}
          value={drawer.effectiveSize}
          min={drawer.splitterMin}
          {max}
          ariaLabel={label}
          onChange={next => drawer.changeSize(next)}
          onDragEnd={() => drawer.save()} />
      {/if}
      <Splitter
        orientation="horizontal"
        className={`md:hidden ${splitterClassName}`}
        value={drawer.effectiveSize}
        min={drawer.splitterMin}
        {max}
        ariaLabel={label}
        onChange={next => drawer.changeSize(next)}
        onDragEnd={() => drawer.save()} />
    {/if}
  </div>
{/snippet}

<svelte:document onkeydown={handleDrawerEscape} />

<header
  class={`flex flex-none items-center justify-between gap-4 border-b border-slate-800 px-3 py-3 sm:px-4 ${headerClassName}`}>
  <div class="flex items-center gap-2">
    {#if showToggle}
      <Button
        variant="secondary"
        size="sm"
        className="-ml-1"
        ariaLabel={toggleLabel}
        ariaExpanded={open}
        tooltip={toggleLabel}
        tooltipAlign="left"
        preventFocusSteal
        onClick={() => leftDrawer.setOpen(!open)}>
        {#snippet icon()}
          <MenuIcon className="h-4 w-4" />
        {/snippet}
      </Button>
    {/if}
    {@render headerLeft?.()}
  </div>
  <div class="flex items-center gap-2">
    {@render headerRight?.()}
    {#if rightPane && showRightToggle}
      <Button
        variant="secondary"
        size="sm"
        className="-mr-1"
        ariaLabel={rightToggleLabel}
        ariaExpanded={rightOpen}
        tooltip={rightToggleLabel}
        tooltipAlign="right"
        preventFocusSteal
        onClick={() => rightDrawer.setOpen(!rightOpen)}>
        {#snippet icon()}
          <MenuIcon className="h-4 w-4" />
        {/snippet}
      </Button>
    {/if}
  </div>
</header>
<div bind:this={rootEl} class="relative flex min-h-0 flex-1 flex-col md:flex-row">
  {#if leftDrawer.visible}
    {@render drawerPane(leftDrawer, leftPane, 'left', resolvedResizeLabel, resolvedLeftPaneLabel, paneClassName)}
  {/if}

  <main
    bind:this={mainEl}
    tabindex="-1"
    inert={overlayOpen}
    class={`min-h-0 min-w-0 flex-1 overflow-y-auto outline-none ${mainClassName}`}>
    {@render children?.()}
  </main>

  {#if rightDrawer.visible}
    {@render drawerPane(
      rightDrawer,
      rightPane,
      'right',
      resolvedRightResizeLabel,
      resolvedRightPaneLabel,
      rightPaneClassName,
    )}
  {/if}

  {#if overlayOpen}
    <button
      type="button"
      tabindex="-1"
      aria-label={resolvedCloseLabel}
      class="absolute inset-0 z-10 bg-slate-950/60"
      onclick={handleBackdropClick}></button>
  {/if}
</div>
