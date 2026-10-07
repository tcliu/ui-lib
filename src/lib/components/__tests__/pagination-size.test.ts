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
  it('keeps stepped chrome while the inner dropdown interpolates', () => {
    instance = mount(Pagination, {
      target,
      props: { total: 100, pageSize: 10, currentPage: 1, size: 14, onPageChange: () => {}, onPageSizeChange: () => {} },
    })
    flushSync()
    // 14 resolves to the xs step for Pagination's own chrome (tie keeps the
    // smaller step), while the inner page-size dropdown carries the
    // interpolated geometry.
    expect(target.querySelector('nav')?.className ?? target.innerHTML).toContain('text-xs')
    const trigger = target.querySelector('[aria-label="Page size"]')
    expect(trigger?.getAttribute('style')).toContain('font-size: 12px')
  })

  it('renders named sizes exactly as before', () => {
    instance = mount(Pagination, {
      target,
      props: { total: 100, pageSize: 10, currentPage: 1, size: 'sm', onPageChange: () => {}, onPageSizeChange: () => {} },
    })
    flushSync()
    expect(target.innerHTML).toContain('text-sm')
    expect(target.querySelector('[aria-label="Page size"]')?.getAttribute('style')).toBeNull()
  })
})
