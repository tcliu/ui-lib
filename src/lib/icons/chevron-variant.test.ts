import type { Component } from 'svelte'
import { describe, expect, it } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import type { SizeInput } from '#lib/size-scale.js'
import ChevronDownIcon from './ChevronDownIcon.svelte'
import ChevronLeftIcon from './ChevronLeftIcon.svelte'
import ChevronRightIcon from './ChevronRightIcon.svelte'
import ChevronUpIcon from './ChevronUpIcon.svelte'
import DoubleChevronDownIcon from './DoubleChevronDownIcon.svelte'
import DoubleChevronLeftIcon from './DoubleChevronLeftIcon.svelte'
import DoubleChevronRightIcon from './DoubleChevronRightIcon.svelte'
import DoubleChevronUpIcon from './DoubleChevronUpIcon.svelte'
import { CHEVRON_STYLE, type ChevronVariant } from './chevron-stroke'

interface ChevronProps {
  className?: string
  size?: SizeInput
  variant?: ChevronVariant
}

// Every glyph in the family, so a new chevron cannot ship without the variant.
const CHEVRONS: [string, Component<ChevronProps>][] = [
  ['ChevronUp', ChevronUpIcon],
  ['ChevronDown', ChevronDownIcon],
  ['ChevronLeft', ChevronLeftIcon],
  ['ChevronRight', ChevronRightIcon],
  ['DoubleChevronUp', DoubleChevronUpIcon],
  ['DoubleChevronDown', DoubleChevronDownIcon],
  ['DoubleChevronLeft', DoubleChevronLeftIcon],
  ['DoubleChevronRight', DoubleChevronRightIcon],
]

function strokeOf(Icon: Component<ChevronProps>, variant?: ChevronVariant) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const instance = mount(Icon, { target, props: variant ? { variant } : {} })
  flushSync()
  const svg = target.querySelector('svg')
  const style = {
    stroke: svg?.getAttribute('stroke-width') ?? null,
    linecap: svg?.getAttribute('stroke-linecap') ?? null,
    linejoin: svg?.getAttribute('stroke-linejoin') ?? null,
  }
  void unmount(instance)
  target.remove()
  return style
}

describe('chevron variant', () => {
  it('draws the rounded regular stroke by default and the flat-ended bold one on request', () => {
    for (const [name, Icon] of CHEVRONS) {
      const regular = CHEVRON_STYLE.regular
      const bold = CHEVRON_STYLE.bold
      expect(strokeOf(Icon), `${name} default`).toEqual({
        stroke: String(regular.stroke),
        linecap: regular.linecap,
        linejoin: regular.linejoin,
      })
      expect(strokeOf(Icon, 'bold'), `${name} bold`).toEqual({
        stroke: String(bold.stroke),
        linecap: bold.linecap,
        linejoin: bold.linejoin,
      })
    }
  })
})
