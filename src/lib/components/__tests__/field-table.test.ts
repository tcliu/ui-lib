import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import { type FieldConfig } from '../FieldTable.svelte'
import { iconOnlyBoxPx } from '../Button.svelte'
import Harness from './field-table.harness.svelte'

let target: HTMLDivElement
let instance: ReturnType<typeof mount> | null = null

beforeEach(() => {
  target = document.createElement('div')
  document.body.appendChild(target)
})

afterEach(async () => {
  if (instance) {
    await unmount(instance)
    instance = null
  }
  target.remove()
})

function fields(overrides: Partial<Record<string, Partial<FieldConfig>>> = {}): FieldConfig[] {
  const base: FieldConfig[] = [
    { name: 'variant', type: "'primary' | 'secondary'", defaultValue: "'secondary'", note: 'Look.', editor: 'enum', options: [{ value: 'primary', label: 'primary' }] },
    { name: 'badge', type: 'string', defaultValue: "''", note: 'Pill.', editor: 'text' },
    { name: 'notes', type: 'string', defaultValue: "''", note: 'Long text.', editor: 'textarea', value: '', onChange: () => {} },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', note: 'Off.', editor: 'boolean' },
    {
      name: 'options',
      type: 'Option[]',
      defaultValue: '—',
      note: 'Rows.',
      editor: 'options-json',
    },
    { name: 'onClick', type: '() => void', defaultValue: '—', note: 'Tap.' },
  ]
  return base.map(field => ({ ...field, ...overrides[field.name] }))
}

function render(list: FieldConfig[], override = false): HTMLElement {
  instance = mount(Harness, { target, props: { fields: list, override } })
  flushSync()
  return target.firstElementChild as HTMLElement
}

describe('FieldTable', () => {
  it('renders the docs headers and one row per field', () => {
    const table = render(fields())
    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent?.trim())
    expect(headers).toEqual(['Prop', 'Type', 'Default', 'Value', 'Notes'])
    expect(table.querySelectorAll('tbody tr')).toHaveLength(6)
  })

  it('renders no pagination footer without pagination props', () => {
    const table = render(fields())
    expect(table.querySelector('nav')).toBeNull()
  })

  it('renders a dash for read-only rows', () => {
    const table = render(fields())
    const row = [...table.querySelectorAll('tbody tr')].find(tr => tr.textContent?.includes('onClick'))
    expect(row?.textContent).toContain('—')
    expect(row?.querySelector('input, [role="combobox"], button')).toBeNull()
  })

  it('commits text edits through onChange', () => {
    const onChange = vi.fn()
    const table = render(fields({ badge: { value: '', onChange } }))
    const input = table.querySelector('input[aria-label="badge value"]') as HTMLInputElement
    input.value = 'new'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    expect(onChange).toHaveBeenCalledWith('new')
  })

  it('commits textarea edits through onChange', () => {
    const onChange = vi.fn()
    const table = render(fields({ notes: { value: 'a\nb', onChange } }))
    const area = table.querySelector('textarea[aria-label="notes value"]') as HTMLTextAreaElement
    expect(area.value).toBe('a\nb')
    area.value = 'c'
    area.dispatchEvent(new Event('input', { bubbles: true }))
    flushSync()
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('renders an area filling the cell for long text values', () => {
    const table = render(fields({ badge: { value: 'a'.repeat(35), onChange: () => {} } }))
    const area = table.querySelector('textarea[aria-label="badge value"]') as HTMLTextAreaElement
    expect(area).not.toBeNull()
    expect(area.classList.contains('absolute')).toBe(true)
    const cell = area.closest('td') as HTMLElement
    expect(cell.classList.contains('relative')).toBe(true)
    // The in-flow spacer holds the natural two-row floor, so a row whose
    // area is its tallest content keeps its height.
    const spacer = cell.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(spacer.style.minHeight).toBe('52.6px')
    expect(table.querySelector('input[aria-label="badge value"]')).toBeNull()
  })

  it('keeps the apply eye inside the cell on a long toggle row', () => {
    const table = render(
      fields({ badge: { value: 'a'.repeat(35), onChange: () => {}, toggle: { enabled: false, onToggle: () => {} } } }),
    )
    expect(table.querySelector('textarea[aria-label="badge value"]')).not.toBeNull()
    expect(table.querySelector('button[aria-label="Apply badge"]')).not.toBeNull()
    // The row reserves the eye zone (cell padding + row gap + the eye's own
    // rendered box), so the absolute area never runs under the eye. The box is
    // the icon slot floored at the button's text row height; assuming the slot
    // alone leaves the inset ~2.6px short at md.
    const row = table.querySelector('div[style*="--area-right"]') as HTMLElement
    expect(parseFloat(row.style.getPropertyValue('--area-right'))).toBeCloseTo(12 + 8 + iconOnlyBoxPx('md'), 6)
  })

  it('keeps a short text value on a single-line input', () => {
    const table = render(fields({ badge: { value: 'hi', onChange: () => {} } }))
    expect(table.querySelector('input[aria-label="badge value"]')).not.toBeNull()
    expect(table.querySelector('textarea[aria-label="badge value"]')).toBeNull()
  })

  it('shows a clear button on an optional text value and commits empty on clear', () => {
    const onChange = vi.fn()
    const table = render(fields({ badge: { value: 'hi', onChange, clearable: true } }))
    const clear = table.querySelector('button[aria-label="Clear badge"]') as HTMLButtonElement
    expect(clear).not.toBeNull()
    clear.click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('hides the clear button while a text value matches its default', () => {
    const table = render(
      fields({
        badge: {
          defaultValue: "'hi'",
          editorDefaultValue: 'hi',
          value: 'hi',
          onChange: () => {},
          clearable: true,
        },
      }),
    )
    expect(table.querySelector('button[aria-label="Clear badge"]')).toBeNull()
  })

  it('shows the clear button while a text value differs from its default', () => {
    const table = render(
      fields({
        badge: {
          defaultValue: "'hi'",
          editorDefaultValue: 'hi',
          value: 'bye',
          onChange: () => {},
          clearable: true,
        },
      }),
    )
    expect(table.querySelector('button[aria-label="Clear badge"]')).not.toBeNull()
  })

  it('ignores marker defaults when deciding the clear baseline', () => {
    const table = render(
      fields({
        badge: {
          defaultValue: 'locale',
          value: 'Close pane',
          onChange: () => {},
          clearable: true,
        },
      }),
    )
    expect(table.querySelector('button[aria-label="Clear badge"]')).not.toBeNull()
  })

  it('hides the clear button while a number value matches its default', () => {
    const table = render([
      ...fields(),
      { name: 'qty', type: 'number?', defaultValue: '480', editorDefaultValue: '480', note: 'Count.', editor: 'number', value: '480', onChange: () => {}, clearable: true },
    ])
    expect(table.querySelector('button[aria-label="Clear qty"]')).toBeNull()
  })

  it('hides the clear button while a multi-word value matches its default', () => {
    const table = render(
      fields({
        badge: {
          defaultValue: "'a b c'",
          editorDefaultValue: 'a b c',
          value: 'a b c',
          onChange: () => {},
          clearable: true,
        },
      }),
    )
    expect(table.querySelector('button[aria-label="Clear badge"]')).toBeNull()
  })

  it('restores the default and unapplies the eye on clear', () => {
    const onChange = vi.fn()
    const onToggle = vi.fn()
    const table = render(
      fields({
        badge: {
          defaultValue: "'hi'",
          editorDefaultValue: 'hi',
          value: 'bye',
          onChange,
          clearable: true,
          toggle: { enabled: true, onToggle },
        },
      }),
    )
    ;(table.querySelector('button[aria-label="Clear badge"]') as HTMLButtonElement).click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('hi')
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('unsets on clear when the row has no literal default', () => {
    const onChange = vi.fn()
    const table = render(
      fields({
        badge: {
          defaultValue: 'locale',
          value: 'Close pane',
          onChange,
          clearable: true,
        },
      }),
    )
    ;(table.querySelector('button[aria-label="Clear badge"]') as HTMLButtonElement).click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('reads the placeholder as the literal default for the clear baseline', () => {
    const table = render(
      fields({
        badge: { defaultValue: "'hi'", placeholder: 'hi', value: 'hi', onChange: () => {}, clearable: true },
      }),
    )
    expect(table.querySelector('button[aria-label="Clear badge"]')).toBeNull()
  })

  it('restores the placeholder default on clear', () => {
    const onChange = vi.fn()
    const table = render(
      fields({
        badge: { defaultValue: "'hi'", placeholder: 'hi', value: 'bye', onChange, clearable: true },
      }),
    )
    ;(table.querySelector('button[aria-label="Clear badge"]') as HTMLButtonElement).click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('hi')
  })

  it('hides the enum clear cross while the value matches its literal default', () => {
    const table = render(
      fields({
        variant: { defaultValue: "'info'", placeholder: 'info', value: 'info', onChange: () => {} },
      }),
    )
    expect(table.querySelector('button[aria-label="Clear variant"]')).toBeNull()
  })

  it('restores the numeric default on clear', () => {
    const onChange = vi.fn()
    const table = render([
      ...fields(),
      { name: 'qty', type: 'number?', defaultValue: '480', editorDefaultValue: '480', note: 'Count.', editor: 'number', value: '481', onChange, clearable: true },
    ])
    ;(table.querySelector('button[aria-label="Clear qty"]') as HTMLButtonElement).click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('480')
  })

  it('renders no clear button on a required text value', () => {
    const table = render(fields({ badge: { value: 'hi', onChange: () => {} } }))
    expect(table.querySelector('button[aria-label="Clear badge"]')).toBeNull()
  })

  it('shows a clear button on an optional number value and commits empty on clear', () => {
    const onChange = vi.fn()
    const table = render([
      ...fields(),
      { name: 'qty', type: 'number', defaultValue: '—', note: 'Count.', editor: 'number', value: '3', onChange, clearable: true },
    ])
    const clear = table.querySelector('button[aria-label="Clear qty"]') as HTMLButtonElement
    expect(clear).not.toBeNull()
    clear.click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('maps the boolean editor to yes/no', () => {
    const onChange = vi.fn()
    const table = render(fields({ disabled: { value: '', onChange } }))
    const box = table.querySelector('input[aria-label="disabled value"]') as HTMLInputElement
    expect(box.checked).toBe(false)
    box.click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('shows the committed enum label on the trigger', () => {
    const table = render(fields({ variant: { value: 'primary', onChange: () => {} } }))
    const trigger = table.querySelector('[aria-label="variant value"]')
    expect(trigger?.textContent).toContain('primary')
  })

  it('offers the named steps on a size editor without options', () => {
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
    // jsdom lacks scrollIntoView; opening the listbox reveals the active row.
    if (typeof Element.prototype.scrollIntoView !== 'function') {
      Element.prototype.scrollIntoView = () => {}
    }
    try {
      const table = render([
        ...fields(),
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | number", defaultValue: "'md'", note: 'Scale.', editor: 'size', value: '', onChange: () => {} },
      ])
      const trigger = table.querySelector('[aria-label="size value"]') as HTMLElement
      trigger.click()
      flushSync()
      // The named steps run xs–xl (the shared size axis).
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(5)
      document.querySelectorAll('[role="listbox"]').forEach(el => el.remove())
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('opens a dialog row whose OK applies the seeded value', () => {
    const onChange = vi.fn()
    const table = render(fields({ options: { value: '["a"]', onChange } }))
    const button = table.querySelector('button[aria-label="Edit options"]') as HTMLButtonElement
    button.click()
    flushSync()
    expect(document.body.textContent).toContain('Edit options')
    const ok = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'OK') as HTMLButtonElement
    // The editor is an action dialog: its OK applies the content, and
    // confirming the unchanged content is still the intended action, so the
    // primary stays enabled while the content is valid.
    expect(ok.disabled).toBe(false)
    ok.click()
    flushSync()
    expect(onChange).toHaveBeenCalledWith('["a"]')
  })

  it('derives JSON validity by default and blocks OK on invalid JSON', () => {
    const onChange = vi.fn()
    const table = render(fields({ options: { value: '{not json', onChange } }))
    ;(table.querySelector('button[aria-label="Edit options"]') as HTMLButtonElement).click()
    flushSync()
    const ok = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'OK') as HTMLButtonElement
    expect(ok.disabled).toBe(true)
    ok.click()
    flushSync()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('honors a custom valid gate and invalid message', () => {
    const onChange = vi.fn()
    const table = render(
      fields({
        options: { value: '["a"]', onChange, dialog: { valid: () => false, invalidMessage: 'Bad JSON.' } },
      }),
    )
    ;(table.querySelector('button[aria-label="Edit options"]') as HTMLButtonElement).click()
    flushSync()
    const ok = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'OK') as HTMLButtonElement
    expect(ok.disabled).toBe(true)
    expect(document.body.textContent).toContain('Bad JSON.')
  })

  it('opens a snippet dialog row through its edit icon', () => {
    const table = render([
      ...fields(),
      { name: 'leading', type: 'Snippet', defaultValue: '—', note: 'Adornment.', editor: 'snippet', value: '', onChange: () => {} },
    ])
    const button = table.querySelector('button[aria-label="Edit leading"]') as HTMLButtonElement
    button.click()
    flushSync()
    expect(document.body.textContent).toContain('Edit leading')
  })

  it('lets a value snippet override the built-in editor', () => {
    const table = render(fields({ badge: { value: '', onChange: () => {} } }), true)
    const overrides = [...table.querySelectorAll('[data-override]')].map(el => el.textContent)
    expect(overrides).toContain('badge-custom')
    expect(table.querySelector('input[aria-label="badge value"]')).toBeNull()
  })

  it('renders a snippet apply toggle beside the edit icon', () => {
    const onToggle = vi.fn()
    const table = render([
      ...fields(),
      { name: 'leading', type: 'Snippet', defaultValue: '—', note: 'Adornment.', editor: 'snippet', value: '', onChange: () => {}, toggle: { enabled: false, onToggle } },
    ])
    const apply = table.querySelector('button[aria-label="Apply leading"]') as HTMLButtonElement
    expect(apply).not.toBeNull()
    apply.click()
    flushSync()
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('shows the unapply action while a snippet is applied', () => {
    const table = render([
      ...fields(),
      { name: 'leading', type: 'Snippet', defaultValue: '—', note: 'Adornment.', editor: 'snippet', value: '', onChange: () => {}, toggle: { enabled: true, onToggle: () => {} } },
    ])
    expect(table.querySelector('button[aria-label="Unapply leading"]')).not.toBeNull()
  })

  it('renders no apply toggle on a snippet row without toggle config', () => {
    const table = render([
      ...fields(),
      { name: 'leading', type: 'Snippet', defaultValue: '—', note: 'Adornment.', editor: 'snippet', value: '', onChange: () => {} },
    ])
    expect(table.querySelector('button[aria-label="Apply leading"]')).toBeNull()
    expect(table.querySelector('button[aria-label="Unapply leading"]')).toBeNull()
  })

  it('renders an apply toggle on a text row carrying toggle config', () => {
    const onToggle = vi.fn()
    const table = render(
      fields({ badge: { value: '', onChange: () => {}, toggle: { enabled: false, onToggle } } }),
    )
    const apply = table.querySelector('button[aria-label="Apply badge"]') as HTMLButtonElement
    expect(apply).not.toBeNull()
    apply.click()
    flushSync()
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('renders no apply toggle on a row without toggle config', () => {
    const table = render(fields({ badge: { value: '', onChange: () => {} } }))
    expect(table.querySelector('button[aria-label="Apply badge"]')).toBeNull()
    expect(table.querySelector('button[aria-label="Unapply badge"]')).toBeNull()
  })

  it('shifts a number eye over the empty outside slot without moving the input', async () => {
    for (const value of ['0', '5']) {
      const table = render([
        ...fields(),
        { name: 'qty', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Count.', editor: 'number', value, onChange: () => {}, clearable: true, toggle: { enabled: false, onToggle: () => {} } },
      ])
      const eye = table.querySelector('button[aria-label="Apply qty"]') as HTMLButtonElement
      // The editor fills the remaining row width in both states, so the
      // input keeps the same width empty and filled.
      const shift = eye.parentElement?.parentElement as HTMLElement
      const editorWrap = shift.previousElementSibling as HTMLElement
      expect(editorWrap.className).toContain('flex-1')
      if (value === '0') {
        // Paint-only shift over the reserved slot: the eye sits against the
        // input while its layout footprint (and the input width) never moves.
        expect(shift.style.transform).toBe('translateX(-22px)')
      } else {
        expect(table.querySelector('button[aria-label="Clear qty"]')).not.toBeNull()
        expect(shift.getAttribute('style')).toBeNull()
      }
      await unmount(instance!)
      instance = null
    }
  })

  it('leaves a number eye after a visible clear button', () => {
    const table = render([
      ...fields(),
      { name: 'qty', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Count.', editor: 'number', value: '5', onChange: () => {}, clearable: true, toggle: { enabled: false, onToggle: () => {} } },
    ])
    expect(table.querySelector('button[aria-label="Clear qty"]')).not.toBeNull()
    const eye = table.querySelector('button[aria-label="Apply qty"]') as HTMLButtonElement
    expect(eye.style.marginLeft).toBe('')
  })

  it('applies no eye shift on a number row without a clear slot', () => {
    const table = render([
      ...fields(),
      { name: 'qty', type: 'number?', defaultValue: '0', editorDefaultValue: '0', note: 'Count.', editor: 'number', value: '0', onChange: () => {}, toggle: { enabled: false, onToggle: () => {} } },
    ])
    const eye = table.querySelector('button[aria-label="Apply qty"]') as HTMLButtonElement
    const wrap = eye.parentElement?.parentElement as HTMLElement
    expect(wrap.getAttribute('style')).toBeNull()
  })
})
