import { describe, expect, it } from 'vitest'
import { extractScriptValue } from '$lib/showcase/snippet-attributes'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import { splitLeadingScript } from '$lib/showcase/snippet-source'
import {
  buildButtonSnippet,
  type ButtonSnippetState,
} from './demo-snippet'

function state(overrides: Partial<ButtonSnippetState> = {}): ButtonSnippetState {
  return {
    label: '',
    childrenEnabled: true,
    variant: '',
    variantOn: true,
    accent: '',
    accentOn: true,
    size: '',
    sizeOn: true,
    disabled: '',
    disabledOn: true,
    pending: '',
    pendingOn: true,
    iconOn: false,
    className: '',
    classNameOn: false,
    ariaControls: '',
    ariaControlsOn: false,
    ariaExpanded: '',
    ariaExpandedOn: true,
    ariaHaspopup: '',
    ariaHaspopupOn: false,
    ariaLabel: '',
    ariaLabelOn: false,
    ariaPressed: '',
    ariaPressedOn: true,
    tooltip: '',
    tooltipOn: false,
    tooltipAlign: '',
    tooltipAlignOn: true,
    buttonType: '',
    buttonTypeOn: true,
    focusRing: '',
    focusRingOn: true,
    preventFocusSteal: '',
    preventFocusStealOn: true,
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
    const source = buildButtonSnippet(state({ childrenEnabled: false, label: 'Custom' }))
    expect(source).not.toContain('<script>')
    expect(source).not.toContain('let label')
    expect(source).not.toContain('{label}')
    expect(source).toContain('onClick={() => (clicks += 1)}>')
  })

  it('stages the eye-gated text rows until applied', () => {
    const staged = buildButtonSnippet(state({ className: 'ml-2', ariaLabel: 'Apply now', tooltip: 'Save help' }))
    expect(staged).not.toContain('className=')
    expect(staged).not.toContain('ariaLabel=')
    expect(staged).not.toContain('tooltip=')
    const applied = buildButtonSnippet(
      state({ className: 'ml-2', classNameOn: true, ariaLabel: 'Apply now', ariaLabelOn: true, tooltip: 'Save help', tooltipOn: true }),
    )
    expect(applied).toContain('className="ml-2"')
    expect(applied).toContain('ariaLabel="Apply now"')
    expect(applied).toContain('tooltip="Save help"')
  })

  it('stages the popup-kind and controlled-id rows until applied', () => {
    const staged = buildButtonSnippet(state({ ariaHaspopup: 'menu', ariaControls: 'panel-1' }))
    expect(staged).not.toContain('ariaHaspopup=')
    expect(staged).not.toContain('ariaControls=')
    const applied = buildButtonSnippet(
      state({ ariaHaspopup: 'menu', ariaHaspopupOn: true, ariaControls: 'panel-1', ariaControlsOn: true }),
    )
    expect(applied).toContain('ariaHaspopup="menu"')
    expect(applied).toContain('ariaControls="panel-1"')
  })

  it('emits the boolean form of the popup kind as an expression', () => {
    expect(buildButtonSnippet(state({ ariaHaspopup: 'true', ariaHaspopupOn: true }))).toContain('ariaHaspopup={true}')
    expect(buildButtonSnippet(state({ ariaHaspopup: 'false', ariaHaspopupOn: true }))).toContain('ariaHaspopup={false}')
  })

  it('omits staged dropdown props while their eyes are off', () => {
    const off = buildButtonSnippet(
      state({ variant: 'primary', variantOn: false, accent: 'emerald', accentOn: false, size: 'sm', sizeOn: false, tooltipAlign: 'right', tooltipAlignOn: false, buttonType: 'submit', buttonTypeOn: false }),
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
        disabled: 'yes',
        disabledOn: false,
        pending: 'yes',
        pendingOn: false,
        ariaExpanded: 'yes',
        ariaExpandedOn: false,
        ariaPressed: 'no',
        ariaPressedOn: false,
        focusRing: 'no',
        focusRingOn: false,
        preventFocusSteal: 'yes',
        preventFocusStealOn: false,
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
        variant: 'primary',
        variantOn: true,
        accent: 'emerald',
        accentOn: true,
        size: 'sm',
        sizeOn: true,
        disabled: 'yes',
        pending: 'yes',
        iconOn: true,
        className: 'ml-2',
        classNameOn: true,
        ariaLabel: 'Apply now',
        ariaLabelOn: true,
        ariaControls: 'panel-1',
        ariaControlsOn: true,
        ariaExpanded: 'yes',
        ariaHaspopup: 'menu',
        ariaHaspopupOn: true,
        ariaPressed: 'no',
        tooltip: 'Save help',
        tooltipOn: true,
        tooltipAlign: 'right',
        tooltipAlignOn: true,
        buttonType: 'submit',
        buttonTypeOn: true,
        focusRing: 'no',
        preventFocusSteal: 'yes',
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
        variant: 'secondary',
        variantOn: true,
        accent: 'cyan',
        accentOn: true,
        size: 'md',
        sizeOn: true,
        disabled: 'no',
        pending: 'no',
        tooltipAlign: 'center',
        tooltipAlignOn: true,
        buttonType: 'button',
        buttonTypeOn: true,
        focusRing: 'yes',
        preventFocusSteal: 'no',
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
    const source = buildButtonSnippet(state({ iconOn: true }))
    expect(source).toContain('{#snippet icon()}')
    expect(source).toContain('<CheckIcon />')
    expect(source).not.toContain('<CheckIcon className=')
  })

  it('emits a numeric size as an expression and omits invalid sizes', () => {
    expect(buildButtonSnippet(state({ size: '14', sizeOn: true }))).toContain('size={14}')
    expect(buildButtonSnippet(state({ size: 'huge' }))).not.toContain('size=')
  })

  it('declares a customized label as a leading script-local and keeps the scope ref in children', () => {
    const custom = buildButtonSnippet(state({ label: 'Save & exit "now"' }))
    expect(custom.startsWith('<script>\n')).toBe(true)
    // JSON.stringify round-trips arbitrary text without breaking the literal.
    expect(custom).toContain('  let label = $state("Save & exit \\"now\\"")')
    expect(custom).toContain('>{label} ({clicks})')

    const unset = buildButtonSnippet(state())
    expect(unset).not.toContain('<script>')
    expect(unset).toContain('>{label} ({clicks})')
  })

  it('escapes markup in the label so it cannot break the snippet', () => {
    const source = buildButtonSnippet(state({ label: '</script><Button>' }))
    expect(source).toContain('let label = $state("\\u003c/script>\\u003cButton>")')
    // The escaped literal reads back as the original text.
    expect(extractScriptValue(splitLeadingScript(source).declarations, 'label')).toBe('</script><Button>')
  })

  it('compiles the generated snippet', { timeout: 30000 }, async () => {
    const component = await createSnippetComponent(buildButtonSnippet(state({ label: '</script><Button>' })), {
      clicks: 0,
    })
    expect(typeof component).toBe('function')
  })
})
