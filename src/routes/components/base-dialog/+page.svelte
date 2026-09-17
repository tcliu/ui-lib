<script lang="ts">
  import BaseDialog from '$lib/components/BaseDialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import Buttons from '$lib/components/Buttons.svelte'
  import Checkbox from '$lib/components/Checkbox.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import PropsTable, { type PropRow } from '$lib/showcase/PropsTable.svelte'
  import ShowcasePage from '$lib/showcase/ShowcasePage.svelte'
  import ShowcaseSection from '$lib/showcase/ShowcaseSection.svelte'

  const i18n = getI18nContext()

  let defaultOpen = $state(false)
  let styledOpen = $state(false)
  let headerOpen = $state(false)
  let pendingOpen = $state(false)
  let fullscreenOpen = $state(false)
  let pending = $state(false)
  let allowPendingCancel = $state(false)

  const props: PropRow[] = [
    { name: 'title', type: 'string', defaultValue: '—', note: 'Heading rendered when no header snippet is passed.' },
    { name: 'titleClass', type: 'string', defaultValue: "''", note: 'Extra classes for the title element.' },
    { name: 'className', type: 'string', defaultValue: "''", note: 'Extra classes for the dialog panel.' },
    { name: 'maxWidth', type: "'md' | … | '7xl' | 'fit' | 'wide'", defaultValue: "'md'", note: 'Panel width variant.' },
    { name: 'height', type: "'auto' | 'fixed' | 'tall'", defaultValue: "'auto'", note: 'Panel height variant.' },
    { name: 'pending', type: 'boolean', defaultValue: 'false', note: 'Disables dismissal while an operation runs.' },
    { name: 'allowPendingCancel', type: 'boolean', defaultValue: 'false', note: 'Keeps dismissal enabled while pending.' },
    { name: 'dismissKeydownCapture', type: 'boolean', defaultValue: 'true', note: 'Registers the capture-phase Escape/Tab handler.' },
    { name: 'fullscreen', type: 'boolean', defaultValue: 'false', note: 'Fills the viewport on an opaque surface.' },
    { name: 'closeLabel', type: 'string', defaultValue: 'locale', note: 'Overrides the close accessible name.' },
    { name: 'onCancel', type: '() => void', defaultValue: '—', note: 'Called by every dismissal affordance.' },
    { name: 'header', type: 'Snippet', defaultValue: '—', note: 'Replaces the title with custom header markup.' },
    { name: 'children', type: 'Snippet', defaultValue: '—', note: 'Dialog body content.' },
  ]
</script>

{#snippet customHeader()}
  <h2 class="text-xl font-semibold tracking-tight text-cyan-200">{i18n.t('showcase.dialogTitle')}</h2>
  <p class="mt-1 text-sm text-slate-400">{i18n.t('showcase.dialogBody')}</p>
{/snippet}

{#snippet propsSnippet()}
  <PropsTable rows={props} />
{/snippet}

<ShowcasePage name="BaseDialog" props={propsSnippet}>
  <ShowcaseSection title={i18n.t('showcase.default')}>
    <Button variant="primary" onClick={() => (defaultOpen = true)}>{i18n.t('showcase.openDialog')}</Button>
    {#if defaultOpen}
      <BaseDialog title={i18n.t('showcase.dialogTitle')} onCancel={() => (defaultOpen = false)}>
        <p data-testid="dialog-body">{i18n.t('showcase.dialogBody')}</p>
        <Buttons align="right" className="mt-4">
          <Button onClick={() => (defaultOpen = false)}>{i18n.t('common.cancel')}</Button>
          <Button variant="primary" onClick={() => (defaultOpen = false)}>{i18n.t('common.ok')}</Button>
        </Buttons>
      </BaseDialog>
    {/if}
  </ShowcaseSection>

  <ShowcaseSection title={i18n.t('showcase.customized')}>
    <Button onClick={() => (styledOpen = true)}>titleClass + className</Button>
    <Button onClick={() => (headerOpen = true)}>header snippet</Button>
    <Button onClick={() => (fullscreenOpen = true)}>{i18n.t('showcase.fullscreenDialog')}</Button>
    <Button onClick={() => (pendingOpen = true)}>{i18n.t('showcase.pendingOption')}</Button>
  </ShowcaseSection>

  {#if styledOpen}
    <BaseDialog
      title={i18n.t('showcase.dialogTitle')}
      titleClass="text-cyan-200"
      className="border-cyan-500/40"
      maxWidth="lg"
      height="fixed"
      closeLabel={i18n.t('common.close')}
      dismissKeydownCapture={true}
      onCancel={() => (styledOpen = false)}>
      <p>{i18n.t('showcase.dialogBody')}</p>
      <Buttons align="right" className="mt-4">
        <Button variant="outline" onClick={() => (styledOpen = false)}>{i18n.t('common.close')}</Button>
      </Buttons>
    </BaseDialog>
  {/if}

  {#if headerOpen}
    <BaseDialog header={customHeader} maxWidth="xl" height="tall" onCancel={() => (headerOpen = false)}>
      <p>{i18n.t('showcase.dialogBody')}</p>
      <Buttons align="right" className="mt-4">
        <Button onClick={() => (headerOpen = false)}>{i18n.t('common.close')}</Button>
      </Buttons>
    </BaseDialog>
  {/if}

  {#if pendingOpen}
    <BaseDialog
      title={i18n.t('showcase.pendingOption')}
      {pending}
      {allowPendingCancel}
      onCancel={() => (pendingOpen = false)}>
      <div class="flex flex-col gap-3">
        <Checkbox bind:checked={pending} label={i18n.t('showcase.pendingOption')} />
        <Checkbox bind:checked={allowPendingCancel} label={i18n.t('showcase.allowPendingCancel')} />
      </div>
      <Buttons align="right" className="mt-4">
        <Button variant="primary" disabled={pending} onClick={() => (pendingOpen = false)}>
          {i18n.t('common.ok')}
        </Button>
      </Buttons>
    </BaseDialog>
  {/if}

  {#if fullscreenOpen}
    <BaseDialog fullscreen closeLabel={i18n.t('common.close')} onCancel={() => (fullscreenOpen = false)}>
      <p>{i18n.t('showcase.dialogBody')}</p>
      <Buttons align="right" className="mt-4">
        <Button onClick={() => (fullscreenOpen = false)}>{i18n.t('common.close')}</Button>
      </Buttons>
    </BaseDialog>
  {/if}

</ShowcasePage>
