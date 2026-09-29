import { describe, expect, it, vi } from 'vitest'
import {
  createDragResize,
  type DragResize,
  type DragResizeOptions,
  type ResizeEdge,
  type ResizeMovePhase,
} from '$lib/components/use-resize-drag.svelte'

type DownEvent = Parameters<DragResize['handlePointerDown']>[0]
type KeyEvent = Parameters<DragResize['handleKeydown']>[0]

function handleElement(): HTMLElement {
  const element = document.createElement('div')
  // jsdom has no pointer-capture APIs.
  element.setPointerCapture = () => {}
  element.hasPointerCapture = () => true
  element.releasePointerCapture = () => {}
  document.body.appendChild(element)
  return element
}

function down(drag: DragResize, element: HTMLElement, x = 0, y = 0): void {
  drag.handlePointerDown({
    clientX: x,
    clientY: y,
    pointerId: 1,
    currentTarget: element,
    preventDefault() {},
  } as unknown as DownEvent)
}

function move(drag: DragResize, x: number, y: number): void {
  drag.handlePointerMove({ clientX: x, clientY: y } as unknown as PointerEvent)
}

function up(drag: DragResize, element: HTMLElement): void {
  drag.handlePointerUp({
    pointerId: 1,
    currentTarget: element,
  } as unknown as DownEvent)
}

function press(drag: DragResize, key: string): void {
  drag.handleKeydown({ key, preventDefault() {} } as unknown as KeyEvent)
}

interface Recorded {
  moves: Array<[number, number, ResizeMovePhase]>
  jumps: ResizeEdge[]
  drag: DragResize
  dragOptions: DragResizeOptions
}

function setup(overrides: Partial<DragResizeOptions> = {}): Recorded {
  const moves: Recorded['moves'] = []
  const jumps: ResizeEdge[] = []
  const dragOptions: DragResizeOptions = {
    horizontal: true,
    vertical: false,
    toDelta: delta => delta,
    onMove: (deltaX, deltaY, phase) => moves.push([deltaX, deltaY, phase]),
    onJump: edge => jumps.push(edge),
    ...overrides,
  }
  return { moves, jumps, drag: createDragResize(dragOptions), dragOptions }
}

describe('createDragResize', () => {
  it('delivers pointer deltas through toDelta for the enabled axes only', () => {
    const { moves, drag } = setup({ toDelta: delta => delta * 2 })
    const element = handleElement()
    down(drag, element, 100, 100)
    move(drag, 130, 170)
    // Horizontal only: the vertical delta is ignored.
    expect(moves).toEqual([[60, 0, 'drag']])
  })

  it('applies both axes for a corner handle', () => {
    const { moves, drag } = setup({ vertical: true })
    const element = handleElement()
    down(drag, element, 100, 100)
    move(drag, 130, 70)
    expect(moves).toEqual([[30, -30, 'drag']])
  })

  it('flips pointer deltas when inverted', () => {
    const { moves, drag, dragOptions } = setup()
    const element = handleElement()
    down(drag, element, 100, 100)
    move(drag, 140, 100)
    expect(moves).toEqual([[40, 0, 'drag']])
    // The option is read per event, so a mid-life change takes effect next move.
    dragOptions.invert = true
    move(drag, 160, 100)
    expect(moves.at(-1)).toEqual([-60, 0, 'drag'])
  })

  it('measures once at drag start', () => {
    const measure = vi.fn()
    const { drag } = setup({ measure })
    const element = handleElement()
    down(drag, element)
    down(drag, element)
    expect(measure).toHaveBeenCalledTimes(2)
    expect(measure).toHaveBeenCalledWith(element)
  })

  it('fires onEnd once per drag, and not after capture has already ended', () => {
    const onEnd = vi.fn()
    const { drag } = setup({ onEnd })
    const element = handleElement()
    down(drag, element)
    up(drag, element)
    expect(onEnd).toHaveBeenCalledTimes(1)
    up(drag, element)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('maps arrow keys to a step and ignores the disabled axis', () => {
    const { moves, drag, dragOptions } = setup({ step: 5 })
    press(drag, 'ArrowRight')
    expect(moves.at(-1)).toEqual([5, 0, 'key'])
    press(drag, 'ArrowLeft')
    expect(moves.at(-1)).toEqual([-5, 0, 'key'])
    press(drag, 'ArrowDown')
    expect(moves).toHaveLength(2)
    press(drag, 'a')
    expect(moves).toHaveLength(2)
    dragOptions.vertical = true
    press(drag, 'ArrowDown')
    expect(moves.at(-1)).toEqual([0, 5, 'key'])
  })

  it('jumps to the edges on Home/End and calls onEnd', () => {
    const { jumps, drag, dragOptions } = setup()
    const onEnd = vi.fn()
    dragOptions.onEnd = onEnd
    press(drag, 'Home')
    press(drag, 'End')
    expect(jumps).toEqual(['min', 'max'])
    expect(onEnd).toHaveBeenCalledTimes(2)
    // Inverted panes swap which edge Home and End reach.
    dragOptions.invert = true
    press(drag, 'Home')
    press(drag, 'End')
    expect(jumps.slice(-2)).toEqual(['max', 'min'])
  })

  it('stops the drag when pointer capture is lost', () => {
    const { moves, drag } = setup()
    const element = handleElement()
    down(drag, element, 0, 0)
    move(drag, 10, 0)
    expect(moves).toHaveLength(1)
    drag.handleLostPointerCapture()
    move(drag, 90, 0)
    expect(moves).toHaveLength(1)
    expect(drag.dragging).toBe(false)
  })

  it('tracks the dragging flag across the drag lifecycle', () => {
    const { drag } = setup()
    const element = handleElement()
    expect(drag.dragging).toBe(false)
    down(drag, element)
    expect(drag.dragging).toBe(true)
    up(drag, element)
    expect(drag.dragging).toBe(false)
  })
})
