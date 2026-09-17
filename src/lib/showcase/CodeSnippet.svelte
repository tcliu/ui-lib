<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import Button from '$lib/components/Button.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'

  interface Props {
    draft?: string
  }

  let { draft = $bindable('') }: Props = $props()
  const i18n = getI18nContext()

  let feedback = $state('')
  let copyTimer: ReturnType<typeof setTimeout> | null = null

  onDestroy(() => {
    if (copyTimer) {
      clearTimeout(copyTimer)
      copyTimer = null
    }
  })

  function flash(message: string) {
    feedback = message
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copyTimer = null
      feedback = ''
    }, 1500)
  }

  function copy() {
    const writeText = navigator.clipboard?.writeText
    if (!writeText) {
      flash(i18n.t('showcase.copyFailed'))
      return
    }
    writeText.call(navigator.clipboard, draft).then(
      () => flash(i18n.t('showcase.copied')),
      () => flash(i18n.t('showcase.copyFailed')),
    )
  }
</script>

{#snippet copyIcon()}
  <CopyIcon className="h-4 w-4" />
{/snippet}

<section aria-label={i18n.t('showcase.code')}>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-xs text-slate-500">{i18n.t('showcase.codeNote')}</p>
    <span class="flex items-center gap-2">
      <span role="status" aria-live="polite" class="text-xs text-slate-400">{feedback}</span>
      <Button
        size="sm"
        icon={copyIcon}
        ariaLabel={i18n.t('showcase.copyCode')}
        tooltip={i18n.t('showcase.copyCode')}
        onClick={copy} />
    </span>
  </div>
  <div class="mt-2">
    <LazyCodeEditor
      bind:content={draft}
      docType="html"
      editorAriaLabel={i18n.t('showcase.code')}
      containerClass="h-64 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
      editorClass="h-full" />
  </div>
</section>
