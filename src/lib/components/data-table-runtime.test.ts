import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, tick, unmount } from 'svelte'
import DataTable, { type DataTableColumn } from './DataTable.svelte'

// DataTable mounts SearchInput, Checkbox, AutoComplete, and ColumnFilter, which
// reach for browser APIs jsdom lacks.
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

interface Row {
  id: number
  name: string
  status: string
}

const ROWS: Row[] = [
  { id: 1, name: 'alpha', status: 'Active' },
  { id: 2, name: 'beta', status: 'Draft' },
  { id: 3, name: 'gamma', status: 'Active' },
]

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', filterable: true },
  { key: 'status', header: 'Status', filterable: true },
]

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  installDomStubs()
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
  vi.unstubAllGlobals()
})

function mountTable(props: Record<string, unknown> = {}): void {
  if (instance) {
    unmount(instance)
    instance = null
  }
  instance = mount(DataTable as unknown as Parameters<typeof mount>[0], {
    target,
    props: { rows: ROWS, columns: COLUMNS, rowId: (row: Row) => String(row.id), ...props },
  })
  flushSync()
}

function bodyRows(): number {
  return target.querySelectorAll('tbody tr').length
}

function trigger(column: string): HTMLButtonElement {
  const button = target.querySelector(`th button[aria-label="Filter ${column}"]`)
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`filter trigger for ${column} not found`)
  }
  return button
}

function openPanel(column: string): HTMLDivElement {
  trigger(column).click()
  flushSync()
  const panel = document.body.querySelector('[role=group][aria-label="Filter ' + column + '"]')
  if (!(panel instanceof HTMLDivElement)) {
    throw new Error(`filter panel for ${column} not found`)
  }
  return panel
}

function filterInput(panel: HTMLElement): HTMLInputElement {
  const input = panel.querySelector('input[role=combobox]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('filter input not found')
  }
  return input
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  flushSync()
}

describe('DataTable column filters', () => {
  it('renders a funnel trigger per filterable column only when enabled', () => {
    mountTable()
    expect(target.querySelectorAll('th button[aria-label^="Filter "]')).toHaveLength(0)

    mountTable({ columnFilters: true })
    expect(target.querySelectorAll('th button[aria-label^="Filter "]')).toHaveLength(2)
    // The popup stays closed until the trigger is used.
    expect(document.body.querySelector('[role=group][aria-label^="Filter "]')).toBeNull()
  })

  it('opens a panel from the trigger and focuses its input', async () => {
    mountTable({ columnFilters: true })
    const panel = openPanel('Status')
    // The panel is portalled after the toggle, and the input takes focus once
    // it mounts.
    await tick()
    flushSync()
    expect(document.activeElement).toBe(filterInput(panel))
    expect(trigger('Status').getAttribute('aria-expanded')).toBe('true')
  })

  it('filters the rows it owns and restores them when cleared', () => {
    mountTable({ columnFilters: true })
    expect(bodyRows()).toBe(3)

    typeInto(filterInput(openPanel('Status')), 'Active')
    expect(bodyRows()).toBe(2)

    typeInto(filterInput(openPanel('Name')), 'gamma')
    expect(bodyRows()).toBe(1)

    const statusPanel = document.body.querySelector('[role=group][aria-label="Filter Status"]') as HTMLElement
    ;(statusPanel.querySelector('button[aria-label="Clear Status"]') as HTMLButtonElement).click()
    flushSync()
    expect(bodyRows()).toBe(1)

    // The toolbar clear drops every column filter.
    ;(target.querySelector('button[aria-label="Clear filters"]') as HTMLButtonElement).click()
    flushSync()
    expect(bodyRows()).toBe(3)
  })

  it('disables the per-column clear while the filter is blank', () => {
    mountTable({ columnFilters: true })
    const panel = openPanel('Status')
    expect((panel.querySelector('button[aria-label="Clear Status"]') as HTMLButtonElement).disabled).toBe(true)
    typeInto(filterInput(panel), 'Active')
    expect((panel.querySelector('button[aria-label="Clear Status"]') as HTMLButtonElement).disabled).toBe(false)
  })

  it('marks a filtered column with ink and a badge, keeping the glyph shape', () => {
    mountTable({ columnFilters: true })
    const restPath = trigger('Status').querySelector('path')?.getAttribute('d')
    expect(trigger('Status').className).toContain('text-slate-400')
    expect(target.querySelector('[data-filter-badge]')).toBeNull()

    typeInto(filterInput(openPanel('Status')), 'Active')
    expect(trigger('Status').className).toContain('text-cyan-400')
    // Same silhouette, so the mark never reads as a different control.
    expect(trigger('Status').querySelector('path')?.getAttribute('d')).toBe(restPath)
    expect(target.querySelector('[data-filter-badge]')).not.toBeNull()
  })

  it('emits onFilter and leaves the rows untouched', () => {
    const onFilter = vi.fn()
    mountTable({ columnFilters: true, onFilter })
    typeInto(filterInput(openPanel('Status')), 'Active')
    expect(onFilter).toHaveBeenCalledWith('status', 'Active')
    expect(bodyRows()).toBe(3)
  })

  it('stays a presenter when pagination is configured without a callback', () => {
    const onPageChange = vi.fn()
    mountTable({
      columnFilters: true,
      rows: [ROWS[0]],
      pagination: { total: 3, pageSize: 1, currentPage: 1, onPageChange },
    })
    typeInto(filterInput(openPanel('Status')), 'Draft')
    expect(bodyRows()).toBe(1)
  })

  it('treats a blank filter as no filter', () => {
    mountTable({ columnFilters: true })
    typeInto(filterInput(openPanel('Status')), '   ')
    expect(bodyRows()).toBe(3)
  })

  it('keeps sort arrows in the header whether filtered or not', () => {
    const columns: DataTableColumn<Row>[] = [{ key: 'name', header: 'Name', sortable: true, filterable: true }]
    mountTable({ columns, columnFilters: true })
    expect(target.querySelector('th button[aria-label="Sort Name ascending"]')).not.toBeNull()
    expect(trigger('Name')).toBeInstanceOf(HTMLButtonElement)
  })
})

describe('DataTable remote paging affordances', () => {
  it('marks the shell busy over loaded rows without dropping them', () => {
    mountTable({ loading: true })
    const root = target.firstElementChild as HTMLElement
    expect(root.getAttribute('aria-busy')).toBe('true')
    expect(bodyRows()).toBe(3)
    expect(target.querySelector('[role=status]')?.textContent).toBe('Loading rows')
  })

  it('is not busy while idle', () => {
    mountTable()
    const root = target.firstElementChild as HTMLElement
    expect(root.hasAttribute('aria-busy')).toBe(false)
    expect(target.querySelector('[role=status]')).toBeNull()
  })

  it('clamps an out-of-range page once when the total shrinks', () => {
    const onPageChange = vi.fn()
    mountTable({ pagination: { total: 3, pageSize: 10, currentPage: 5, onPageChange } })
    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('leaves a valid page alone', () => {
    const onPageChange = vi.fn()
    mountTable({ pagination: { total: 30, pageSize: 10, currentPage: 2, onPageChange } })
    expect(onPageChange).not.toHaveBeenCalled()
  })
})
