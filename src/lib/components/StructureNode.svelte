<script module lang="ts">
  // Row class split: the structural base is fixed (icon reveal rides `group`,
  // layout and highlight sizing ride the rest), while the tunable slot carries
  // gaps, padding, rounding, and highlight. A custom `containerRowClass` or
  // `leafRowClass` replaces only its tunable default, so gap overrides never
  // fight a leftover utility and structural classes cannot be dropped. The
  // showcase page seeds its class rows from the tunable defaults.
  export const STRUCTURE_ROW_BASE_CLASS = 'group flex w-fit max-w-full items-center'
  export const DEFAULT_CONTAINER_ROW_CLASS = 'gap-2 rounded py-1 hover:bg-slate-800/40'
  export const DEFAULT_LEAF_ROW_CLASS = 'gap-1 rounded py-1 hover:bg-slate-800/40'
</script>

<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Self from './StructureNode.svelte'
  import Button from './Button.svelte'
  import Copyable from './Copyable.svelte'
  import EditDialog from './EditDialog.svelte'
  import LazyCodeEditor from './LazyCodeEditor.svelte'
  import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte'
  import EditIcon from '$lib/icons/EditIcon.svelte'
  import CopyIcon from '$lib/icons/CopyIcon.svelte'
  import {
    type StructureEntry,
    childEntries,
    containerSummary,
    copyValue,
    inputText,
    isContainer,
    jsonPath,
    parseInputValue,
    valueClass,
    valueText,
  } from './structure-value'
  import { createInlineEdit } from './use-structure-inline-edit.svelte'
  import { createStructureObjectEditor } from './use-structure-object-editor.svelte'
  import { getI18nContext } from '$lib/i18n.svelte'
  const i18n = getI18nContext()

  interface Props {
    label: string
    value: object | unknown[]
    depth?: number
    path?: string[]
    onChange?: (path: string[], newValue: unknown) => void
    onRenameKey?: (parentPath: string[], oldKey: string, newKey: string) => void
    editable?: boolean
    /** True when the parent container is an array: index labels cannot rename. */
    parentIsArray?: boolean
    /** Replaces the tunable container header row classes (gaps, padding, highlight). */
    containerRowClass?: string
    /** Replaces the tunable leaf row classes (gaps, padding, highlight). */
    leafRowClass?: string
  }

  let {
    label,
    value,
    depth = 0,
    path = [],
    onChange,
    onRenameKey,
    editable = true,
    parentIsArray = false,
    containerRowClass,
    leafRowClass,
  }: Props = $props()

  // One-shot openness from the static depth: a derived default keeps the
  // toggle override without reading a prop inside a `$state` initializer.
  let openOverride = $state<boolean | null>(null)
  const open = $derived(openOverride ?? depth === 0)

  const entries = $derived(childEntries(value))

  // Value edit, key rename, and own-label rename share one measured inline
  // field; the commit and keydown logic below interprets each field's text.
  const editValue = createInlineEdit<string>()
  const editName = createInlineEdit<string>()
  const editOwnName = createInlineEdit<boolean>()

  let measureEl = $state<HTMLSpanElement | null>(null)
  let editBtnEl = $state<HTMLSpanElement | null>(null)
  let editBtnWidth = $state(32)

  // Owned object-edit dialog lifecycle. The seed/draft are set on open and the
  // parsed document only commits on OK, so cancelling never touches live state.
  const objectEditor = createStructureObjectEditor({
    getValue: () => value,
    getPath: () => path,
    getOnChange: () => onChange,
  })

  $effect(() => {
    if (editBtnEl) {
      editBtnWidth = editBtnEl.getBoundingClientRect().width
    }
  })

  function startEditValue(entry: StructureEntry) {
    const text = inputText(entry.value)
    editValue.begin(entry.key, text, measureText(text) + editBtnWidth + 4)
  }

  function startEditName(entry: StructureEntry) {
    editName.begin(entry.key, entry.key, measureText(entry.key) + 8)
  }

  function startEditOwnName() {
    editOwnName.begin(true, label, measureText(label) + 8)
  }

  function measureText(text: string): number {
    if (!measureEl) return 0
    measureEl.textContent = text
    const width = measureEl.getBoundingClientRect().width
    // The span is visually hidden but still in the DOM text; clear it once
    // measured so it never leaks into textContent assertions or copying.
    measureEl.textContent = ''
    return width
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(i18n.t('editor.toast.copied'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : i18n.t('editor.toast.copyFailed'))
    }
  }

  function commitValue() {
    const key = editValue.key
    if (key === null || !onChange) {
      editValue.cancel()
      return
    }
    const entry = entries.find(e => e.key === key)
    if (!entry) {
      editValue.cancel()
      return
    }
    const next = parseInputValue(editValue.text)
    if (next === entry.value) {
      editValue.cancel()
      return
    }
    onChange([...path, key], next)
    editValue.cancel()
  }

  function commitName() {
    const key = editName.key
    if (key === null || !onRenameKey) {
      editName.cancel()
      return
    }
    const entry = entries.find(e => e.key === key)
    if (!entry) {
      editName.cancel()
      return
    }
    const next = editName.text.trim()
    if (!next || next === key) {
      editName.cancel()
      return
    }
    onRenameKey(path, key, next)
    editName.cancel()
  }

  function commitOwnName() {
    if (!onRenameKey) {
      editOwnName.cancel()
      return
    }
    const next = editOwnName.text.trim()
    if (next && next !== label) {
      onRenameKey(path.slice(0, -1), label, next)
    }
    editOwnName.cancel()
  }

  function handleValueKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitValue()
    } else if (event.key === 'Escape') {
      editValue.cancel()
    }
  }

  function handleNameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitName()
    } else if (event.key === 'Escape') {
      editName.cancel()
    }
  }

  function handleOwnNameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitOwnName()
    } else if (event.key === 'Escape') {
      editOwnName.cancel()
    }
  }

  function entryPath(entry: StructureEntry): string[] {
    return [...path, entry.key]
  }

  const nodeJsonPath = $derived(jsonPath(path))
</script>

<span bind:this={measureEl} class="invisible absolute font-mono text-sm leading-snug whitespace-pre" aria-hidden="true"
></span>

<div class="font-mono text-sm leading-snug">
  <div class={`${STRUCTURE_ROW_BASE_CLASS} ${containerRowClass || DEFAULT_CONTAINER_ROW_CLASS}`}>
    <Button
      size="xs"
      variant="ghost"
      ariaLabel={open ? i18n.t('structure.collapse', { name: label }) : i18n.t('structure.expand', { name: label })}
      ariaExpanded={open}
      onClick={() => (openOverride = !open)}
      className="shrink-0">
      {#snippet icon()}
        <ChevronRightIcon className="text-slate-400 transition-transform {open ? 'rotate-90' : ''}" />
      {/snippet}
    </Button>
    <span class={editOwnName.key ? 'min-w-0' : 'min-w-0 truncate'}>
      {#if label !== ''}
        {#if editOwnName.key && onRenameKey && editable}
          <input
            bind:this={editOwnName.input}
            bind:value={editOwnName.text}
            class="min-w-[2ch] rounded bg-slate-900 px-1 py-1 font-mono text-sm leading-snug text-slate-300 outline outline-1 outline-cyan-500"
            style={`width: ${editOwnName.minWidth || 40}px`}
            onblur={commitOwnName}
            onkeydown={handleOwnNameKeydown} />
        {:else if onRenameKey && editable && path.length > 0 && !parentIsArray}
          <span
            class="cursor-pointer rounded text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500"
            ondblclick={e => {
              e.stopPropagation()
              startEditOwnName()
            }}
            onkeydown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                startEditOwnName()
              }
            }}
            title={i18n.t('structure.renameHint')}
            role="button"
            tabindex="0">{label}</span>
        {:else}
          <span class="text-slate-300">{label}</span>
        {/if}
        <span class="text-slate-600">:</span>
      {/if}
      <span class="text-slate-400">{containerSummary(value)}</span>
    </span>
    {#if onChange && editable}
      <span
        class="shrink-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:opacity-0">
        <Button
          size="sm"
          variant="ghost"
          ariaLabel={i18n.t('structure.editKey', { name: nodeJsonPath })}
          tooltip={i18n.t('structure.editKey', { name: nodeJsonPath })}
          onClick={e => {
            e.stopPropagation()
            objectEditor.openEditor()
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
          }}
          className="bg-transparent p-1.5 text-slate-400 hover:text-cyan-300">
          {#snippet icon()}
            <EditIcon />
          {/snippet}
        </Button>
      </span>
    {/if}
    <span
      class="shrink-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:opacity-0">
      <Button
        size="sm"
        variant="ghost"
        ariaLabel={i18n.t('structure.copyValue', { name: nodeJsonPath })}
        tooltip={i18n.t('structure.copyValue', { name: nodeJsonPath })}
        onClick={e => {
          e.stopPropagation()
          void handleCopy(copyValue(value))
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
        }}
        className="bg-transparent p-1.5 text-slate-400 hover:text-cyan-300">
        {#snippet icon()}
          <CopyIcon />
        {/snippet}
      </Button>
    </span>
  </div>

  {#if open}
    <div class={depth === 0 ? 'ml-[0.3rem] pl-2' : 'ml-[0.3rem] border-l border-slate-800 pl-2'}>
      {#each entries as entry (entry.key)}
        {#if isContainer(entry.value)}
          <Self
            label={entry.key}
            value={entry.value as object | unknown[]}
            depth={depth + 1}
            path={entryPath(entry)}
            {onChange}
            {onRenameKey}
            {editable}
            {containerRowClass}
            {leafRowClass}
            parentIsArray={Array.isArray(value)} />
        {:else if editValue.key === entry.key && onChange && editable}
          <div class={`${STRUCTURE_ROW_BASE_CLASS} ${leafRowClass || DEFAULT_LEAF_ROW_CLASS}`}>
            <span class="w-4 shrink-0"></span>
            <span class="shrink-0 text-slate-300">{entry.key}</span>
            <span class="shrink-0 text-slate-600">:</span>
            <div class="flex-1">
              <input
                bind:this={editValue.input}
                bind:value={editValue.text}
                class="min-w-[2ch] rounded bg-slate-900 px-1 py-1 font-mono text-sm leading-snug outline outline-1 outline-cyan-500"
                style={`width: ${editValue.minWidth || 40}px`}
                onblur={commitValue}
                onkeydown={handleValueKeydown} />
            </div>
          </div>
        {:else if editName.key === entry.key && onRenameKey && editable}
          <div class={`${STRUCTURE_ROW_BASE_CLASS} ${leafRowClass || DEFAULT_LEAF_ROW_CLASS}`}>
            <span class="w-4 shrink-0"></span>
            <input
              bind:this={editName.input}
              bind:value={editName.text}
              class="min-w-[2ch] rounded bg-slate-900 px-1 py-1 font-mono text-sm leading-snug text-slate-300 outline outline-1 outline-cyan-500"
              style={`width: ${editName.minWidth || 40}px`}
              onblur={commitName}
              onkeydown={handleNameKeydown} />
            <span class="shrink-0 text-slate-600">:</span>
            <span class={valueClass(entry.value)}>{valueText(entry.value)}</span>
          </div>
        {:else}
          <div class={`${STRUCTURE_ROW_BASE_CLASS} ${leafRowClass || DEFAULT_LEAF_ROW_CLASS}`}>
            <span class="w-4 shrink-0"></span>
            {#if onRenameKey && editable}
              <span
                class="shrink-0 cursor-pointer rounded text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500"
                ondblclick={e => {
                  e.stopPropagation()
                  startEditName(entry)
                }}
                onkeydown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    startEditName(entry)
                  }
                }}
                title={i18n.t('structure.renameHint')}
                role="button"
                tabindex="0">{entry.key}</span>
            {:else}
              <span class="shrink-0 text-slate-300">{entry.key}</span>
            {/if}
            <span class="shrink-0 text-slate-600">:</span>
            {#if onChange && editable}
              <button
                type="button"
                class="min-w-0 cursor-pointer truncate rounded bg-transparent text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500"
                title={i18n.t('structure.editKey', { name: jsonPath(entryPath(entry)) })}
                onclick={() => startEditValue(entry)}
                ondblclick={() => startEditValue(entry)}>
                <span class={valueClass(entry.value)}>{valueText(entry.value)}</span>
              </button>
              <span
                bind:this={editBtnEl}
                class="shrink-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:opacity-0">
                <Button
                  size="sm"
                  variant="ghost"
                  ariaLabel={i18n.t('structure.editKey', { name: jsonPath(entryPath(entry)) })}
                  tooltip={i18n.t('structure.editKey', { name: jsonPath(entryPath(entry)) })}
                  onClick={e => {
                    e.stopPropagation()
                    startEditValue(entry)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                  }}
                  className="bg-transparent p-1.5 text-slate-400 hover:text-cyan-300">
                  {#snippet icon()}
                    <EditIcon />
                  {/snippet}
                </Button>
              </span>
            {:else}
              <span class="min-w-0 truncate text-slate-400">
                <span class={valueClass(entry.value)}>{valueText(entry.value)}</span>
              </span>
            {/if}
            <span
              class="shrink-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:opacity-0">
              <Button
                size="sm"
                variant="ghost"
                ariaLabel={i18n.t('structure.copyValue', { name: jsonPath(entryPath(entry)) })}
                tooltip={i18n.t('structure.copyValue', { name: jsonPath(entryPath(entry)) })}
                onClick={e => {
                  e.stopPropagation()
                  void handleCopy(copyValue(entry.value))
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                }}
                className="bg-transparent p-1.5 text-slate-400 hover:text-cyan-300">
                {#snippet icon()}
                  <CopyIcon />
                {/snippet}
              </Button>
            </span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  {#snippet objectActions()}
    <Button variant="outline" type="button" disabled={!objectEditor.valid} onClick={objectEditor.format}>
      {i18n.t('structure.format')}
    </Button>
  {/snippet}

  {#snippet objectTitle()}
    <Copyable text={nodeJsonPath} textClass="text-slate-100">
      <span>{nodeJsonPath}</span>
    </Copyable>
  {/snippet}

  {#if objectEditor.open}
    <EditDialog
      header={objectTitle}
      widthVariant="3xl"
      closeLabel={i18n.t('common.close')}
      saveLabel={i18n.t('common.ok')}
      resetLabel={i18n.t('common.reset')}
      discardTitle={i18n.t('common.discardTitle')}
      discardMessage={i18n.t('common.discardMessage')}
      discardLabel={i18n.t('common.discard')}
      dirty={objectEditor.dirty}
      saveDisabled={!objectEditor.valid}
      onSave={objectEditor.save}
      onReset={objectEditor.reset}
      onClose={objectEditor.close}
      actions={objectActions}>
      <div class="flex min-h-0 flex-col gap-3">
        <LazyCodeEditor
          bind:content={objectEditor.draft}
          docType="json"
          editorAriaLabel={nodeJsonPath}
          containerClass="h-96 overflow-hidden rounded-md border border-slate-700 bg-slate-950"
          editorClass="h-full" />
        {#if !objectEditor.valid}
          <p role="alert" class="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {i18n.t('common.invalidJson')}
          </p>
        {/if}
      </div>
    </EditDialog>
  {/if}
</div>
