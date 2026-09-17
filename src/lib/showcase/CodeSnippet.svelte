<script lang="ts">
  import { getI18nContext } from '$lib/i18n.svelte'
  import Button from '$lib/components/Button.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'

  interface Props {
    code: string
  }

  let { code }: Props = $props()
  const i18n = getI18nContext()

  let open = $state(false)
  let draft = $state('')
  let feedback = $state('')
  let copyTimer: ReturnType<typeof setTimeout> | null = null
  let lastCode: string | undefined = undefined

  // Seed the editable text from the prop, and re-seed only when the prop
  // actually changes so local edits survive unrelated re-renders.
  $effect(() => {
    if (code === lastCode) return
    lastCode = code
    draft = code
  })

  $effect(() => {
    return () => {
      if (copyTimer) {
        clearTimeout(copyTimer)
        copyTimer = null
      }
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
    <Button size="sm" ariaExpanded={open} onClick={() => (open = !open)}>
      {open ? i18n.t('showcase.hideCode') : i18n.t('showcase.showCode')}
    </Button>
    {#if open}
      <span class="flex items-center gap-2">
        <span role="status" aria-live="polite" class="text-xs text-slate-400">{feedback}</span>
        <Button
          size="sm"
          icon={copyIcon}
          ariaLabel={i18n.t('showcase.copyCode')}
          tooltip={i18n.t('showcase.copyCode')}
          onClick={copy} />
      </span>
    {/if}
  </div>
  {#if open}
    <p class="mt-2 text-xs text-slate-500">{i18n.t('showcase.codeNote')}</p>
    <textarea
      bind:value={draft}
      aria-label={i18n.t('showcase.code')}
      spellcheck="false"
      class="mt-2 block max-h-96 min-h-40 w-full resize-y overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-sm leading-relaxed text-slate-100 outline-none transition focus-visible:border-cyan-500 motion-reduce:transition-none"
    ></textarea>
  {/if}
</section>
