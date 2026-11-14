import { describe, expect, it } from 'vitest'
import { extractScriptValue } from '#showcase/playground/snippet-attributes.js'
import { createSnippetComponent } from '#showcase/playground/snippet-playground.js'
import { splitLeadingScript } from '#showcase/playground/snippet-source.js'
import { staged } from '#showcase/playground/staged.js'
import {
  buildButtonSnippet,
  type ButtonSnippetState,
} from './demo-snippet'

function state(overrides: Partial<ButtonSnippetState> = {}): ButtonSnippetState {
  return {
    label: staged('', true),
    variant: staged('', true),
    accent: staged('', true),
    size: staged('', true),
    disabled: staged('', true),
    pending: staged('', true),
    icon: staged('<CheckIcon />'),
    className: staged(''),
    ariaControls: staged(''),
    ariaExpanded: staged('', true),
    ariaHaspopup: staged(''),
    ariaLabel: staged(''),
    ariaPressed: staged('', true),
    tooltip: staged(''),
    tooltipAlign: staged('', true),
    buttonType: staged('', true),
    focusRing: staged('', true),
    form: staged(''),
    preventFocusSteal: staged('', true),
    ...overrides,
  }
}

describe('buildButtonSnippet', () => {
  it('omits every option while unset', () => {
    const source = buildButtonSnippet(state())
    expect(source).toContain('<Button')
    expect(source).toContain('onClick={() => (clicks += 1)}>{label} ({clicks})')
    expect(source).not.toContain('<script>')
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('{#snippet icon()}')
    expect(source).not.toContain('className=')
    expect(source).not.toContain('ariaLabel=')
    expect(source).not.toContain('ariaControls=')
    expect(source).not.toContain('ariaExpanded')
    expect(source).not.toContain('ariaHaspopup')
    expect(source).not.toContain('ariaPressed')
    expect(source).not.toContain('tooltip')
    expect(source).not.toContain('type=')
    expect(source).not.toContain('focusRing')
    expect(source).not.toContain('preventFocusSteal')
  })

  it('omits the label content and script while the children toggle is off', () => {
    const source = buildButtonSnippet(state({ label: staged('Custom', false) }))
    expect(source).not.toContain('<script>')
    expect(source).not.toContain('let label')
    expect(source).not.toContain('{label}')
    expect(source).toContain('onClick={() => (clicks += 1)}>')
  })

  it('stages the eye-gated text rows until applied', () => {
    const parked = buildButtonSnippet(state({ className: staged('ml-2'), ariaLabel: staged('Apply now'), tooltip: staged('Save help') }))
    expect(parked).not.toContain('className=')
    expect(parked).not.toContain('ariaLabel=')
    expect(parked).not.toContain('tooltip=')
    const applied = buildButtonSnippet(
      state({ className: staged('ml-2', true), ariaLabel: staged('Apply now', true), tooltip: staged('Save help', true) }),
    )
    expect(applied).toContain('className="ml-2"')
    expect(applied).toContain('ariaLabel="Apply now"')
    expect(applied).toContain('tooltip="Save help"')
  })

  it('stages the popup-kind and controlled-id rows until applied', () => {
    const parked = buildButtonSnippet(state({ ariaHaspopup: staged('menu'), ariaControls: staged('panel-1') }))
    expect(parked).not.toContain('ariaHaspopup=')
    expect(parked).not.toContain('ariaControls=')
    const applied = buildButtonSnippet(
      state({ ariaHaspopup: staged('menu', true), ariaControls: staged('panel-1', true) }),
    )
    expect(applied).toContain('ariaHaspopup="menu"')
    expect(applied).toContain('ariaControls="panel-1"')
  })

  it('emits the boolean form of the popup kind as an expression', () => {
    expect(buildButtonSnippet(state({ ariaHaspopup: staged('true', true) }))).toContain('ariaHaspopup={true}')
    expect(buildButtonSnippet(state({ ariaHaspopup: staged('false', true) }))).toContain('ariaHaspopup={false}')
  })

  it('emits the form id only while its eye is on', () => {
    expect(buildButtonSnippet(state({ form: staged('checkout', true) }))).toContain('form="checkout"')
    expect(buildButtonSnippet(state({ form: staged('checkout') }))).not.toContain('form=')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildButtonSnippet(
      state({ variant: staged('primary'), accent: staged('emerald'), size: staged('sm'), tooltipAlign: staged('right'), buttonType: staged('submit') }),
    )
    expect(off).not.toContain('variant=')
    expect(off).not.toContain('accent=')
    expect(off).not.toContain('size=')
    expect(off).not.toContain('tooltipAlign=')
    expect(off).not.toContain('type=')
  })

  it('omits boolean flags while their eyes are off', () => {
    const source = buildButtonSnippet(
      state({
        disabled: staged('yes'),
        pending: staged('yes'),
        ariaExpanded: staged('yes'),
        ariaPressed: staged('no'),
        focusRing: staged('no'),
        preventFocusSteal: staged('yes'),
      }),
    )
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('pending')
    expect(source).not.toContain('ariaExpanded')
    expect(source).not.toContain('ariaPressed')
    expect(source).not.toContain('focusRing')
    expect(source).not.toContain('preventFocusSteal')
  })

  it('emits variant, accent, size, flags, icon, and className', () => {
    const source = buildButtonSnippet(
      state({
        variant: staged('primary', true),
        accent: staged('emerald', true),
        size: staged('sm', true),
        disabled: staged('yes', true),
        pending: staged('yes', true),
        icon: staged('<CheckIcon />', true),
        className: staged('ml-2', true),
        ariaLabel: staged('Apply now', true),
        ariaControls: staged('panel-1', true),
        ariaExpanded: staged('yes', true),
        ariaHaspopup: staged('menu', true),
        ariaPressed: staged('no', true),
        tooltip: staged('Save help', true),
        tooltipAlign: staged('right', true),
        buttonType: staged('submit', true),
        focusRing: staged('no', true),
        preventFocusSteal: staged('yes', true),
      }),
    )
    expect(source).toContain('variant="primary"')
    expect(source).toContain('accent="emerald"')
    expect(source).toContain('size="sm"')
    expect(source).toContain('  disabled\n')
    expect(source).toContain('  pending\n')
    expect(source).toContain('{#snippet icon()}')
    expect(source).toContain('<CheckIcon />')
    expect(source).toContain('className="ml-2"')
    expect(source).toContain('ariaLabel="Apply now"')
    expect(source).toContain('ariaControls="panel-1"')
    expect(source).toContain('  ariaExpanded\n')
    expect(source).toContain('ariaHaspopup="menu"')
    expect(source).toContain('ariaPressed={false}')
    expect(source).toContain('tooltip="Save help"')
    expect(source).toContain('tooltipAlign="right"')
    expect(source).toContain('type="submit"')
    expect(source).toContain('focusRing={false}')
    expect(source).toContain('  preventFocusSteal\n')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildButtonSnippet(
      state({
        variant: staged('secondary', true),
        accent: staged('cyan', true),
        size: staged('md', true),
        disabled: staged('no', true),
        pending: staged('no', true),
        tooltipAlign: staged('center', true),
        buttonType: staged('button', true),
        focusRing: staged('yes', true),
        preventFocusSteal: staged('no', true),
      }),
    )
    expect(source).not.toContain('variant=')
    expect(source).not.toContain('accent=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('disabled')
    expect(source).not.toContain('pending')
    expect(source).not.toContain('tooltipAlign=')
    expect(source).not.toContain('type=')
    expect(source).not.toContain('focusRing')
    expect(source).not.toContain('preventFocusSteal')
  })

  it('emits the bare icon glyph inside the icon snippet', () => {
    const source = buildButtonSnippet(state({ icon: staged('<CheckIcon />', true) }))
    expect(source).toContain('{#snippet icon()}')
    expect(source).toContain('<CheckIcon />')
    expect(source).not.toContain('<CheckIcon className=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildButtonSnippet(state({ size: staged('14', true) }))).toContain('size={14}')
    expect(buildButtonSnippet(state({ size: staged('huge') }))).not.toContain('size=')
  })

  it('declares a customized label as a leading script-local and keeps the scope ref in children', () => {
    const custom = buildButtonSnippet(state({ label: staged('Save & exit "now"', true) }))
    expect(custom.startsWith('<script>\n')).toBe(true)
    // JSON.stringify round-trips arbitrary text without breaking the literal.
    expect(custom).toContain('  let label = $state("Save & exit \\"now\\"")')
    expect(custom).toContain('>{label} ({clicks})')

    const unset = buildButtonSnippet(state())
    expect(unset).not.toContain('<script>')
    expect(unset).toContain('>{label} ({clicks})')
  })

  it('escapes markup in the label so it cannot break the snippet', () => {
    const source = buildButtonSnippet(state({ label: staged('</script><Button>', true) }))
    expect(source).toContain('let label = $state("\\u003c/script>\\u003cButton>")')
    // The escaped literal reads back as the original text.
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'label')).toBe('</script><Button>')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildButtonSnippet(state({ label: staged('</script><Button>', true) })), {
      clicks: 0,
    })
    expect(typeof component).toBe('function')
  })
})
