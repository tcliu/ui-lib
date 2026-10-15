import { describe, expect, it } from 'vitest'
import { createSnippetComponent } from '$lib/showcase/snippet-playground'
import {
  buildEditActionsMarkup,
  buildEditBodyMarkup,
  buildEditDialogSnippet,
  normalizeEditActionsDraft,
  normalizeEditBodyDraft,
  parseEditActionsLabel,
  parseEditActionsMarkup,
  parseEditBodyMarkup,
  parseEditBodySegments,
  type EditDialogSnippetState,
} from './demo-snippet'

function state(overrides: Partial<EditDialogSnippetState> = {}): EditDialogSnippetState {
  return {
    widthVariant: '',
    widthVariantOn: true,
    heightVariant: '',
    heightVariantOn: true,
    size: '',
    sizeOn: true,
    dirty: '',
    dirtyOn: true,
    pending: '',
    pendingOn: true,
    saveDisabled: '',
    saveDisabledOn: true,
    children: '',
    childrenEnabled: true,
    actions: '',
    actionsEnabled: false,
    closeLabel: '',
    closeLabelOn: true,
    discardLabel: '',
    discardLabelOn: true,
    discardMessage: '',
    discardMessageOn: true,
    discardTitle: '',
    discardTitleOn: true,
    resetLabel: '',
    resetLabelOn: true,
    saveLabel: '',
    saveLabelOn: true,
    title: '',
    titleOn: true,
    header: '',
    headerOn: false,
    ...overrides,
  }
}

describe('buildEditDialogSnippet', () => {
  it('renders the titled dialog with the default body while unset', () => {
    const source = buildEditDialogSnippet(state())
    expect(source).toContain('title={dialogTitle}')
    expect(source).toContain('closeLabel={closeLabel}')
    expect(source).toContain('saveLabel={okLabel}')
    expect(source).toContain('resetLabel={resetLabel}')
    expect(source).toContain('discardTitle={discardTitle}')
    expect(source).toContain('discardMessage={discardMessage}')
    expect(source).toContain('discardLabel={discardLabel}')
    expect(source).toContain('discardTitle={discardTitle}')
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('size=')
    expect(source).not.toContain('dirty')
    expect(source).not.toContain('pending')
    expect(source).toContain('    <TextInput bind:value={draft} type="text" ariaLabel={dialogTitle} />')
    expect(source).toContain('</EditDialog>')
  })

  it('emits the width variant and flags when set', () => {
    const source = buildEditDialogSnippet(state({ widthVariant: 'lg', dirty: 'yes', pending: 'yes', saveDisabled: 'yes' }))
    expect(source).toContain('widthVariant="lg"')
    expect(source).toContain('    dirty\n')
    expect(source).toContain('    pending\n')
    expect(source).toContain('    saveDisabled\n')
  })

  it('emits the height variant and size shorthand when set', () => {
    const source = buildEditDialogSnippet(state({ heightVariant: 'xl', size: '4xl' }))
    expect(source).toContain('heightVariant="xl"')
    expect(source).toContain('size="4xl"')
    expect(source).not.toContain('widthVariant=')
  })

  it('omits component defaults (the Value column prefills them)', () => {
    const source = buildEditDialogSnippet(
      state({ widthVariant: 'md', heightVariant: 'auto', dirty: 'no', pending: 'no', saveDisabled: 'no' }),
    )
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('dirty')
    expect(source).not.toContain('pending')
    expect(source).not.toContain('saveDisabled')
  })

  it('omits sizing props while their eyes are off', () => {
    const source = buildEditDialogSnippet(
      state({
        widthVariant: 'lg',
        widthVariantOn: false,
        heightVariant: 'xl',
        heightVariantOn: false,
        size: '4xl',
        sizeOn: false,
      }),
    )
    expect(source).not.toContain('widthVariant=')
    expect(source).not.toContain('heightVariant=')
    expect(source).not.toContain('size=')
  })

  it('omits boolean flags while their eyes are off', () => {
    const source = buildEditDialogSnippet(state({ dirty: 'yes', dirtyOn: false, pending: 'yes', pendingOn: false, saveDisabled: 'yes', saveDisabledOn: false }))
    expect(source).not.toContain('dirty')
    expect(source).not.toContain('pending')
    expect(source).not.toContain('saveDisabled')
  })

  it('omits label literals while their eyes are off', () => {
    const source = buildEditDialogSnippet(
      state({
        title: 'Rename',
        titleOn: false,
        closeLabel: 'Dismiss',
        closeLabelOn: false,
        saveLabel: 'Save it',
        saveLabelOn: false,
        resetLabel: 'Undo',
        resetLabelOn: false,
        discardTitle: 'Sure?',
        discardTitleOn: false,
        discardMessage: 'Lose it',
        discardMessageOn: false,
        discardLabel: 'Drop it',
        discardLabelOn: false,
      }),
    )
    expect(source).toContain('title={dialogTitle}')
    expect(source).toContain('closeLabel={closeLabel}')
    expect(source).toContain('saveLabel={okLabel}')
    expect(source).toContain('resetLabel={resetLabel}')
    expect(source).toContain('discardTitle={discardTitle}')
    expect(source).toContain('discardMessage={discardMessage}')
    expect(source).toContain('discardLabel={discardLabel}')
    expect(source).not.toContain('Rename')
    expect(source).not.toContain('Dismiss')
  })

  it('emits committed children verbatim and self-closes when children are off', () => {
    const set = buildEditDialogSnippet({
      ...state(),
      children: '<TextInput bind:value={draft} type="number" ariaLabel="Count" />\n<span>note-123</span>',
    })
    expect(set).toContain('    <TextInput bind:value={draft} type="number" ariaLabel="Count" />')
    expect(set).toContain('    <span>note-123</span>')
    const off = buildEditDialogSnippet(state({ childrenEnabled: false }))
    expect(off).toContain('onClose={() => (open = false)} />')
    expect(off).not.toContain('TextInput')
    expect(off).not.toContain('</EditDialog>')
  })

  it('emits label literals when set', () => {
    const source = buildEditDialogSnippet(
      state({ title: 'Rename "x"', closeLabel: 'Dismiss', saveLabel: 'Save it', resetLabel: 'Undo', discardTitle: 'Sure?', discardMessage: 'a & b', discardLabel: 'Drop it' }),
    )
    expect(source).toContain('title="Rename &quot;x&quot;"')
    expect(source).toContain('closeLabel="Dismiss"')
    expect(source).toContain('saveLabel="Save it"')
    expect(source).toContain('resetLabel="Undo"')
    expect(source).toContain('discardTitle="Sure?"')
    expect(source).toContain('discardMessage="a &amp; b"')
    expect(source).toContain('discardLabel="Drop it"')
  })

  it('omits the actions snippet while the eye is off', () => {
    const source = buildEditDialogSnippet(state())
    expect(source).not.toContain('{#snippet actions()}')
    expect(source).not.toContain('JSON.stringify(JSON.parse(draft)')
  })

  it('emits the actions snippet with the committed label while on', () => {
    const source = buildEditDialogSnippet(
      state({ actions: '<Button variant="outline" type="button">Tidy</Button>', actionsEnabled: true }),
    )
    expect(source).toContain('    {#snippet actions()}')
    expect(source).toContain('JSON.stringify(JSON.parse(draft), null, 2)')
    expect(source).toContain('>Tidy</Button>')
    const canonical = buildEditDialogSnippet(state({ actionsEnabled: true }))
    expect(canonical).toContain('>Format</Button>')
  })

  it('compiles the generated snippet with actions applied', { timeout: 30000 }, async () => {
    const source = buildEditDialogSnippet(
      state({ actions: '<Button variant="outline" type="button">Tidy</Button>', actionsEnabled: true }),
    )
    const component = await createSnippetComponent(source, {
      open: true,
      draft: '{"a":1}',
      saved: '{"a":1}',
      openDialogLabel: 'Open dialog',
      dialogTitle: 'Dialog title',
      closeLabel: 'Close',
      okLabel: 'OK',
      resetLabel: 'Reset',
      discardTitle: 'Discard?',
      discardMessage: 'Lose changes?',
      discardLabel: 'Discard',
    })
    expect(typeof component).toBe('function')
  })

  it('emits the header snippet with the committed line while on', () => {
    const source = buildEditDialogSnippet(
      state({ header: '<Copyable text="$.user"><span>$.user</span></Copyable>', headerOn: true }),
    )
    expect(source).toContain('    {#snippet header()}')
    expect(source).toContain('      <Copyable text="$.user"><span>$.user</span></Copyable>')
    const off = buildEditDialogSnippet(
      state({ header: '<Copyable text="$.user"><span>$.user</span></Copyable>', headerOn: false }),
    )
    expect(off).not.toContain('{#snippet header()}')
  })

  it('compiles the generated snippet with a header applied', { timeout: 30000 }, async () => {
    const source = buildEditDialogSnippet(
      state({ header: '<Copyable text="$.user"><span>$.user</span></Copyable>', headerOn: true }),
    )
    const component = await createSnippetComponent(source, {
      open: true,
      draft: '{"a":1}',
      saved: '{"a":1}',
      openDialogLabel: 'Open dialog',
      dialogTitle: 'Dialog title',
      closeLabel: 'Close',
      okLabel: 'OK',
      resetLabel: 'Reset',
      discardTitle: 'Discard?',
      discardMessage: 'Lose changes?',
      discardLabel: 'Discard',
    })
    expect(typeof component).toBe('function')
  })
})

describe('parseEditBodyMarkup', () => {
  it('accepts the canonical TextInput with scope and literal names', () => {
    expect(parseEditBodyMarkup('<TextInput bind:value={draft} type="text" ariaLabel={dialogTitle} />')).toBe(
      '<TextInput bind:value={draft} type="text" ariaLabel={dialogTitle} />',
    )
    expect(parseEditBodyMarkup('<TextInput bind:value={draft} type="number" ariaLabel="Count & more" />')).toBe(
      '<TextInput bind:value={draft} type="number" ariaLabel="Count & more" />',
    )
    expect(buildEditBodyMarkup({ type: '', label: '' })).toBe(
      '<TextInput bind:value={draft} type="text" ariaLabel={dialogTitle} />',
    )
  })

  it('accepts arbitrary HTML elements and text alongside controls', () => {
    const draft = ['<TextInput bind:value={draft} type="number" ariaLabel="Count" />', '<span>note-123</span>', 'plain-123'].join('\n')
    expect(parseEditBodyMarkup(draft)).toBe(draft)
  })

  it('rejects expressions, components, unbalanced, and handler markup', () => {
    expect(parseEditBodyMarkup('')).toBeNull()
    expect(parseEditBodyMarkup('nope')).toBe('nope')
    expect(parseEditBodyMarkup('<input type="text" bind:value={draft} />')).toBeNull()
    expect(parseEditBodyMarkup('<TextInput bind:value={value} />')).toBeNull()
    expect(parseEditBodyMarkup('<TextInput bind:value={draft} type="" />')).toBeNull()
    expect(parseEditBodyMarkup('<TextInput bind:value={draft} type="text" ariaLabel="" />')).toBeNull()
    expect(parseEditBodyMarkup('<MyControl />')).toBeNull()
    expect(parseEditBodyMarkup('<span>oops')).toBeNull()
    expect(parseEditBodyMarkup('<span>{label}</span>')).toBeNull()
    expect(parseEditBodyMarkup('<button onclick="go()">x</button>')).toBeNull()
  })

  it('normalizes drafts to one trimmed line per row', () => {
    expect(normalizeEditBodyDraft('  <span>a</span>\n\n   plain  \n')).toBe('<span>a</span>\nplain')
  })
})

describe('parseEditActionsMarkup', () => {
  it('accepts the canonical outline Button line', () => {
    expect(buildEditActionsMarkup({ label: '' })).toBe('<Button variant="outline" type="button">Format</Button>')
    expect(parseEditActionsMarkup('<Button variant="outline" type="button">Tidy</Button>')).toBe(
      '<Button variant="outline" type="button">Tidy</Button>',
    )
    expect(parseEditActionsLabel('<Button variant="outline" type="button">Tidy</Button>')).toBe('Tidy')
  })

  it('rejects empty, multi-line, and non-Button markup', () => {
    expect(parseEditActionsMarkup('')).toBeNull()
    expect(parseEditActionsMarkup('nope')).toBeNull()
    expect(parseEditActionsMarkup('<Button variant="outline" type="button"></Button>')).toBeNull()
    expect(parseEditActionsMarkup('<Button variant="primary" type="button">Tidy</Button>')).toBeNull()
    expect(parseEditActionsMarkup('<Button variant="outline" type="button">A & B</Button>')).toBe(
      '<Button variant="outline" type="button">A & B</Button>',
    )
    expect(parseEditActionsMarkup('<Button variant="outline" type="button">A{B}</Button>')).toBeNull()
    expect(
      parseEditActionsMarkup(
        '<Button variant="outline" type="button">One</Button>\n<Button variant="outline" type="button">Two</Button>',
      ),
    ).toBeNull()
  })

  it('normalizes drafts to one trimmed line', () => {
    expect(normalizeEditActionsDraft('  <Button variant="outline" type="button">Tidy</Button>\n\n')).toBe(
      '<Button variant="outline" type="button">Tidy</Button>',
    )
  })
})

describe('parseEditBodySegments', () => {
  it('splits controls from verbatim HTML', () => {
    expect(
      parseEditBodySegments('<TextInput bind:value={draft} type="number" ariaLabel="Count" />\n<span>note-123</span>'),
    ).toEqual([
      { kind: 'textinput', type: 'number', ariaLabel: { kind: 'literal', value: 'Count' } },
      { kind: 'html', html: '<span>note-123</span>' },
    ])
    expect(parseEditBodySegments('<TextInput bind:value={draft} />')).toEqual([
      { kind: 'textinput', type: '', ariaLabel: null },
    ])
    expect(parseEditBodySegments('<TextInput bind:value={draft} ariaLabel={dialogTitle} />')).toEqual([
      { kind: 'textinput', type: '', ariaLabel: { kind: 'scope' } },
    ])
    expect(parseEditBodySegments('<span>oops')).toBeNull()
  })
})
