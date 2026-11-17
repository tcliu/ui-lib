import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Harness from './table-model.harness.svelte'
import type { DataTableColumn } from './DataTable.svelte'
import type { TableModel } from './use-table-model.svelte'

interface Row {
  id: number
  name: string
  amount: number
}

const ROWS: Row[] = [
  { id: 1, name: 'zeta', amount: 300 },
  { id: 2, name: 'alpha', amount: 100 },
  { id: 3, name: 'beta', amount: 200 },
  { id: 4, name: 'item10', amount: 20 },
  { id: 5, name: 'item2', amount: 40 },
]

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', searchable: true, cell: undefined },
  { key: 'amount', header: 'Amount', sortable: true, num: true },
]

// DataTable mounts Tooltip/Pagination, which need the browser APIs jsdom lacks.
function installDomStubs(): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
  }))
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {}
  }
}

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null
let model: TableModel<Row> | null = null

function mountTable(options: { withToolbar?: boolean; pageSize?: number } = {}): void {
  instance = mount(Harness, {
    target,
    props: {
      rows: ROWS,
      rowId: (row: Row) => String(row.id),
      columns: COLUMNS,
      pageSize: options.pageSize ?? 2,
      withToolbar: options.withToolbar ?? false,
      onready: (next: TableModel<Row>) => {
        model = next
      },
    },
  })
  flushSync()
}

function rowCount(): number {
  return target.querySelectorAll('tbody tr').length
}

function buttonByLabel(label: string): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll('button')).find(
    candidate => candidate.getAttribute('aria-label') === label,
  )
  if (!button) {
    throw new Error(`no button labelled ${label}`)
  }
  return button as HTMLButtonElement
}

beforeEach(() => {
  installDomStubs()
  target = document.createElement('div')
  document.body.appendChild(target)
  model = null
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
  vi.unstubAllGlobals()
})

describe('DataTable managed mode', () => {
  it('renders the model page slice and the footer only when another page exists', () => {
    mountTable()
    expect(rowCount()).toBe(2)
    expect(target.querySelector('[aria-label="Pagination"]')).not.toBeNull()
    expect(target.querySelectorAll('input[type=checkbox]').length).toBe(3)
  })

  it('hides the footer when the model fits one page', () => {
    mountTable({ pageSize: 10 })
    expect(rowCount()).toBe(5)
    expect(target.querySelector('[aria-label="Pagination"]')).toBeNull()
  })

  it('toggles a row and the page from the table controls', () => {
    mountTable()
    const [, rowCheckbox, secondCheckbox] = target.querySelectorAll<HTMLInputElement>('input[type=checkbox]')
    rowCheckbox!.click()
    flushSync()
    expect(model!.selectedIds.size).toBe(1)

    secondCheckbox!.click()
    flushSync()
    expect(model!.selectedIds.size).toBe(2)
    expect(target.textContent).toContain('2 selected')

    const [headerCheckbox] = target.querySelectorAll<HTMLInputElement>('input[type=checkbox]')
    headerCheckbox!.click()
    flushSync()
    expect(model!.selectedIds.size).toBe(0)
  })

  it('drives the model search from the search field', () => {
    mountTable()
    const search = target.querySelector<HTMLInputElement>('input[type=search]')
    if (!search) {
      throw new Error('no search input')
    }
    search.value = 'alp'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    expect(model!.searchValue).toBe('alp')
    expect(model!.pageRows.map(row => row.id)).toEqual([2])
  })

  it('drives the model sort from a header control', () => {
    mountTable()
    buttonByLabel('Sort Amount ascending').click()
    flushSync()
    expect(model!.sortKey).toBe('amount')
    expect(model!.sortDirection).toBe('asc')

    buttonByLabel('Sort Amount descending').click()
    flushSync()
    expect(model!.sortDirection).toBe('desc')
    expect(model!.pageRows.map(row => row.id)).toEqual([1, 3])
  })

  it('renders the batch toolbar only when content is supplied', () => {
    mountTable()
    expect(target.querySelector('[data-test=batch]')).toBeNull()

    if (instance) {
      unmount(instance)
      instance = null
    }
    mountTable({ withToolbar: true })
    expect(target.querySelector('[data-test=batch]')?.textContent?.trim()).toBe('Batch 0')
    expect(target.textContent).toContain('0 selected')
  })

  it('clears the selection through the toolbar callback', () => {
    mountTable({ withToolbar: true })
    const [, rowCheckbox] = target.querySelectorAll<HTMLInputElement>('input[type=checkbox]')
    rowCheckbox!.click()
    flushSync()
    expect(model!.selectedIds.size).toBe(1)

    ;(target.querySelector('[data-test=batch]') as HTMLButtonElement).click()
    flushSync()
    expect(model!.selectedIds.size).toBe(0)
  })
})
