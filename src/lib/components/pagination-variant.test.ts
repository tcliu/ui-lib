import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Pagination from './Pagination.svelte'

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

function render(props: Record<string, unknown> = {}): HTMLElement {
  instance = mount(Pagination, {
    target,
    props: {
      total: 100,
      pageSize: 10,
      currentPage: 3,
      onPageChange: () => {},
      onPageSizeChange: () => {},
      ...props,
    },
  })
  flushSync()
  return target.querySelector('nav') as HTMLElement
}

describe('Pagination compact variant', () => {
  it('keeps the numbered blocks and page-size selector by default', () => {
    const nav = render()
    expect(nav.querySelector('[aria-label="Page size"]')).not.toBeNull()
    expect(nav.textContent).not.toContain('Page 3 of 10')
  })

  it('renders the page summary without numbered blocks or the page-size selector', () => {
    const nav = render({ variant: 'compact' })
    expect(nav.textContent).toContain('Page 3 of 10')
    expect(nav.querySelector('[aria-label="Page size"]')).toBeNull()
    expect(nav.querySelector('[aria-label="Previous page"]')).not.toBeNull()
    expect(nav.querySelector('[aria-label="Next page"]')).not.toBeNull()
  })

  it('substitutes the caller pageOf label', () => {
    const nav = render({ variant: 'compact', labels: { pageOf: 'Seite {page}/{total}' } })
    expect(nav.textContent).toContain('Seite 3/10')
  })
})
