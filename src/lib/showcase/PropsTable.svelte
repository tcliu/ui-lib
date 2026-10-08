<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getI18nContext } from '$lib/i18n.svelte'

  export interface PropRow {
    name: string
    type: string
    defaultValue: string
    note: string
  }

  interface Props {
    rows: PropRow[]
    // Renders each prop's current value in a column between Default and Note.
    // Omitted (the default) keeps the table at its original columns.
    value?: Snippet<[PropRow]>
  }

  let { rows, value }: Props = $props()
  const i18n = getI18nContext()
</script>

<div class="overflow-x-auto" tabindex="-1">
  <table class="w-full border-collapse text-left text-sm">
    <thead>
      <tr class="border-b border-slate-700 text-slate-400">
        <th scope="col" class="py-2 pr-3 font-medium">{i18n.t('showcase.prop')}</th>
        <th scope="col" class="py-2 pr-3 font-medium">{i18n.t('showcase.type')}</th>
        <th scope="col" class="py-2 pr-3 font-medium">{i18n.t('showcase.default')}</th>
        {#if value}
          <th scope="col" class="py-2 pr-3 font-medium">{i18n.t('showcase.value')}</th>
        {/if}
        <th scope="col" class="py-2 font-medium">{i18n.t('showcase.note')}</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr class="border-b border-slate-800 align-top">
          <td class="py-2 pr-3 font-mono text-cyan-300">{row.name}</td>
          <td class="py-2 pr-3 font-mono text-slate-300">{row.type}</td>
          <td class="py-2 pr-3 font-mono text-slate-400">{row.defaultValue}</td>
          {#if value}
            <td class="py-2 pr-3">{@render value(row)}</td>
          {/if}
          <td class="py-2 text-slate-400">{row.note}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
