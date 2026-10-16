import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import Pagination from '../Pagination.svelte'

// Same DOM stubs as the other component tests: jsdom lacks ResizeObserver,
// matchMedia, and scrollIntoView.
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

describe('Pagination numeric size', () => {
  it('scales chrome continuously while the inner dropdown interpolates', () => {
    instance = mount(Pagination, {
      target,
      props: { total: 100, pageSize: 10, currentPage: 1, size: 14, onPageChange: () => {}, onPageSizeChange: () => {} },
    })
    flushSync()
    // Numeric sizes scale every metric by a constant ratio: 14 * 0.875, and the
    // select line/padY the block height derives from: 14 * 1.1875 / 0.39375.
    const nav = target.querySelector('nav')
    expect(nav?.getAttribute('style')).toContain('--pg-font: 12.25px')
    expect(nav?.getAttribute('style')).toContain('--pg-line: 16.625px')
    expect(nav?.getAttribute('style')).toContain('--pg-pad-y: 5.5125px')
    // The block height matches the page-size dropdown trigger's box.
    expect(nav?.getAttribute('style')).toContain(
      '--pg-btn: calc(var(--pg-line) + 2 * var(--pg-pad-y) + 2px)',
    )
    const trigger = target.querySelector('[aria-label="Page size"]')
    expect(trigger?.getAttribute('style')).toContain('--sel-font: 11.375px')
  })

  it('renders named sizes through the same var path', () => {
    instance = mount(Pagination, {
      target,
      props: { total: 100, pageSize: 10, currentPage: 1, size: 'sm', onPageChange: () => {}, onPageSizeChange: () => {} },
    })
    flushSync()
    const nav = target.querySelector('nav')
    expect(nav?.getAttribute('style')).toContain('--pg-font: 12.25px')
    // The inner dropdown resolves the sm dimension through the same var path.
    const trigger = target.querySelector('[aria-label="Page size"]')
    expect(trigger?.getAttribute('style')).toContain('--sel-font: 11.375px')
  })
})

describe('Pagination page-size options', () => {
  function openPageSizeOptions(): string[] {
    target.querySelector('[aria-label="Page size"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    flushSync()
    return [...document.querySelectorAll('[role=listbox] [role=option]')].map(
      element => element.textContent?.trim() ?? '',
    )
  }

  it('offers the default choices without the prop', () => {
    instance = mount(Pagination, {
      target,
      props: { total: 100, pageSize: 10, currentPage: 1, onPageChange: () => {}, onPageSizeChange: () => {} },
    })
    flushSync()
    expect(openPageSizeOptions()).toEqual(['10', '20', '50'])
  })

  it('offers custom choices through pageSizeOptions', () => {
    instance = mount(Pagination, {
      target,
      props: {
        total: 100,
        pageSize: 5,
        currentPage: 1,
        pageSizeOptions: [5, 15, 30],
        onPageChange: () => {},
        onPageSizeChange: () => {},
      },
    })
    flushSync()
    expect(openPageSizeOptions()).toEqual(['5', '15', '30'])
  })
})
