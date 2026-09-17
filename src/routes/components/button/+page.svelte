<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let clicks = $state(0)
  let lastKey = $state('')
  let pressed = $state(false)
  let expanded = $state(false)
  let submitted = $state(0)
  let boundEl = $state<HTMLButtonElement | null>(null)

  const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost'] as const
  const accents = ['cyan', 'emerald', 'amber', 'violet', 'rose'] as const

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    submitted += 1
  }

  const codeDefault = `<Button variant="primary">primary</Button>
<Button variant="secondary">secondary</Button>
<Button variant="danger">danger</Button>
<Button variant="outline">outline</Button>
<Button variant="ghost">ghost</Button>
<Button variant="primary" size="sm">Default sm</Button>
<Button disabled>Default disabled</Button>`

  const codeCustomized = `<Button variant="primary" accent="cyan">cyan</Button>
<Button variant="primary" accent="emerald">emerald</Button>
<Button variant="primary" accent="amber">amber</Button>
<Button variant="primary" accent="violet">violet</Button>
<Button variant="primary" accent="rose">rose</Button>
<Button variant="outline" accent="cyan">cyan</Button>
<Button variant="outline" accent="emerald">emerald</Button>
<Button variant="outline" accent="amber">amber</Button>
<Button variant="outline" accent="violet">violet</Button>
<Button variant="outline" accent="rose">rose</Button>
<Button variant="primary" className="uppercase tracking-wide">className</Button>`

  const codeIcons = `<Button icon={checkIcon}>With icon</Button>
<Button icon={checkIcon} ariaLabel="Reload" tooltip="Reload" />
<Button tooltip="Apply" tooltipAlign="left">Apply</Button>
<Button tooltip="Cancel" tooltipAlign="right">Cancel</Button>
<Button variant="primary" badge={3}>Apply</Button>
<Button badge="new">Reload</Button>
<Button variant="primary" dataTip="Reset">Reset dataTip</Button>
<Button variant="primary" pending>Reload</Button>`

  const codeInteractive = `<Button onClick={() => (clicks += 1)}>Apply ({clicks})</Button>
<Button onKeyDown={event => (lastKey = event.key)}>OK key: {lastKey || '—'}</Button>
<Button ariaPressed={pressed} onClick={() => (pressed = !pressed)}>pressed: {String(pressed)}</Button>
<Button ariaExpanded={expanded} onClick={() => (expanded = !expanded)}>expanded: {String(expanded)}</Button>
<Button preventFocusSteal onClick={() => (clicks += 1)}>preventFocusSteal</Button>
<form onsubmit={handleSubmit}>
  <Button type="submit">type=submit ({submitted})</Button>
</form>
<Button bind:buttonEl={boundEl}>buttonEl: {boundEl ? boundEl.tagName : '—'}</Button>`

  const props: PropRow[] = [
    { name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'", defaultValue: "'secondary'", note: 'Visual treatment.' },
    { name: 'accent', type: "'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'", defaultValue: "'cyan'", note: 'Tint for primary, outline, and badge.' },
    { name: 'size', type: "'sm' | 'md'", defaultValue: "'md'", note: 'Control size.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Native disabled + reduced opacity.' },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disabled state with a spinner slot.' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", note: 'Native button type.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes appended to the button.' },
    { name: 'ariaPressed', type: 'boolean', defaultValue: '—', note: 'Toggle state for pressable buttons.' },
    { name: 'ariaExpanded', type: 'boolean', defaultValue: '—', note: 'Disclosure state for popover triggers.' },
    { name: 'ariaLabel', type: 'string', defaultValue: '—', note: 'Accessible name for icon-only buttons.' },
    { name: 'onClick', type: '(event: MouseEvent) => void', defaultValue: '—', note: 'Click handler.' },
    { name: 'onKeyDown', type: '(event: KeyboardEvent) => void', defaultValue: '—', note: 'Keydown handler.' },
    { name: 'preventFocusSteal', type: 'boolean', defaultValue: 'false', note: 'Keeps focus on the current element when clicked.' },
    { name: 'dataTip', type: 'string', defaultValue: '—', note: 'data-tip attribute for the host tooltip engine.' },
    { name: 'tooltip', type: 'string', defaultValue: '—', note: 'Wraps the button with the positioned Tooltip.' },
    { name: 'tooltipAlign', type: "'center' | 'left' | 'right'", defaultValue: "'center'", note: 'Tooltip alignment.' },
    { name: 'badge', type: 'string | number', defaultValue: '—', note: 'Count pill overhanging the top-right corner.' },
    { name: 'icon', type: 'Snippet', defaultValue: '—', note: 'Leading icon; icon-only when no children.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Button label/content.' },
    { name: 'buttonEl', type: 'HTMLButtonElement | null', defaultValue: 'null', note: 'Bindable native button element.' },
  ]
</script>

{#snippet checkIcon()}
  <CheckIcon className="h-4 w-4" />
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="Button" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')} code={codeDefault}>
    {#each variants as variant (variant)}
      <Button {variant}>{variant}</Button>
    {/each}
    <Button variant="primary" size="sm">{i18n.t('showcase.default')} sm</Button>
    <Button disabled>{i18n.t('showcase.default')} disabled</Button>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')} code={codeCustomized}>
    {#each accents as accent (accent)}
      <Button variant="primary" {accent}>{accent}</Button>
    {/each}
    {#each accents as accent (accent)}
      <Button variant="outline" {accent}>{accent}</Button>
    {/each}
    <Button variant="primary" className="uppercase tracking-wide">className</Button>
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.iconsBadgeTooltip')} code={codeIcons} scope={{ checkIcon }}>
    <Button icon={checkIcon}>With icon</Button>
    <Button icon={checkIcon} ariaLabel={i18n.t('common.reload')} tooltip={i18n.t('common.reload')} />
    <Button tooltip={i18n.t('common.apply')} tooltipAlign="left">{i18n.t('common.apply')}</Button>
    <Button tooltip={i18n.t('common.cancel')} tooltipAlign="right">{i18n.t('common.cancel')}</Button>
    <Button variant="primary" badge={3}>{i18n.t('common.apply')}</Button>
    <Button badge="new">{i18n.t('common.reload')}</Button>
    <Button variant="primary" dataTip={i18n.t('common.reset')}>{i18n.t('common.reset')} dataTip</Button>
    <Button variant="primary" pending>{i18n.t('common.reload')}</Button>
  </ShowcaseSection>

  <ShowcaseSection
    title={i18n.t('showcase.interactive')}
    code={codeInteractive}
    scope={{ clicks, lastKey, pressed, expanded, submitted, boundEl: null, handleSubmit }}>
    <Button onClick={() => (clicks += 1)}>{i18n.t('common.apply')} ({clicks})</Button>
    <Button onKeyDown={event => (lastKey = event.key)}>{i18n.t('common.ok')} key: {lastKey || '—'}</Button>
    <Button ariaPressed={pressed} onClick={() => (pressed = !pressed)}>
      pressed: {String(pressed)}
    </Button>
    <Button ariaExpanded={expanded} onClick={() => (expanded = !expanded)}>
      expanded: {String(expanded)}
    </Button>
    {#if expanded}
      <div class="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">disclosure panel</div>
    {/if}
    <Button preventFocusSteal onClick={() => (clicks += 1)}>preventFocusSteal</Button>
    <form onsubmit={handleSubmit}>
      <Button type="submit">type=submit ({submitted})</Button>
    </form>
    <Button bind:buttonEl={boundEl}>buttonEl: {boundEl ? boundEl.tagName : '—'}</Button>
  </ShowcaseSection>
</ShowcasePage>
