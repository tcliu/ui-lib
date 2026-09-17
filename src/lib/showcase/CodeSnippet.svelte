<script lang="ts">
  import { onDestroy } from 'svelte'
  import { mount, unmount } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  import Button from '$lib/components/Button.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'
  import LazyCodeEditor from '$lib/components/LazyCodeEditor.svelte'
  import { createSnippetComponent, snippetErrorMessage } from './snippet-playground'

  interface Props {
    code: string
    // Values the snippet references besides the shared primitives (page state,
    // snippets, and helpers). They are destructured into the compiled
    // component; see snippet-playground.ts.
    scope?: Record<string, unknown>
  }

  let { code, scope = {} }: Props = $props()
  const i18n = getI18nContext()

  let draft = $state('')
  let feedback = $state('')
  let error = $state('')
  let previewEl = $state<HTMLDivElement | null>(null)
  let copyTimer: ReturnType<typeof setTimeout> | null = null
  let compileTimer: ReturnType<typeof setTimeout> | null = null
  let lastCode: string | undefined = undefined
  let compileGeneration = 0
  let previewInstance: ReturnType<typeof mount> | null = null

  // Seed the editable text from the prop, and re-seed only when the prop
  // actually changes so local edits survive unrelated re-renders.
  $effect(() => {
    if (code === lastCode) return
    lastCode = code
    draft = code
  })

  // Debounce recompiles: an edit restarts the timer, so the compiler only runs
  // once the typing pauses. The cleanup clears the pending timer on the next
  // edit and on teardown.
  $effect(() => {
    const next = draft
    if (compileTimer) clearTimeout(compileTimer)
    compileTimer = setTimeout(() => {
      compileTimer = null
      void compileAndRender(next)
    }, 300)
    return () => {
      if (compileTimer) {
        clearTimeout(compileTimer)
        compileTimer = null
      }
    }
  })

  onDestroy(() => {
    if (copyTimer) {
      clearTimeout(copyTimer)
      copyTimer = null
    }
    if (compileTimer) {
      clearTimeout(compileTimer)
      compileTimer = null
    }
    if (previewInstance) {
      void unmount(previewInstance)
      previewInstance = null
    }
  })

  async function compileAndRender(source: string) {
    const generation = ++compileGeneration
    try {
      const Component = await createSnippetComponent(source, scope)
      if (generation !== compileGeneration) return
      // Render into a detached staging node first: a render-time throw must
      // leave the previous demo in place, not blank it.
      const staging = document.createElement('div')
      const instance = mount(Component, { target: staging })
      if (generation !== compileGeneration) {
        void unmount(instance)
        return
      }
      if (previewInstance) {
        void unmount(previewInstance)
      }
      previewInstance = instance
      previewEl?.replaceChildren(...Array.from(staging.childNodes))
      error = ''
    } catch (failure) {
      if (generation !== compileGeneration) return
      error = snippetErrorMessage(failure)
    }
  }

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
  <div class="mt-3">
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {i18n.t('showcase.preview')}
    </p>
    {#if error}
      <p
        role="alert"
        class="mb-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-200">
        {error}
      </p>
    {/if}
    <div
      bind:this={previewEl}
      data-testid="snippet-preview"
      role="group"
      aria-label={i18n.t('showcase.preview')}
      class="relative flex min-h-16 flex-wrap items-start gap-4 overflow-x-auto rounded-md border border-slate-800 bg-slate-900/40 p-3 [contain:paint]">
    </div>
  </div>
</section>
