import { expect, test } from '@playwright/test'
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components'
import { editorContains, normalizeDemoText, replaceSnippet } from './helpers'

// Every registered page is a converted page: opening the shell's title-row
// code toggle live-compiles the seed, which must reproduce the static demo
// with no error, and closing it restores the static demo and tears the editor
// down. Anchor on the shell's stable hooks (`data-showcase-block`,
// `data-showcase-titlebar`, `data-showcase-demo`) rather than DOM nesting, so
// a layout restructure cannot silently match nothing.
for (const { slug, name } of SHOWCASE_COMPONENTS) {
  test(`showcase: ${name} snippets reproduce their static demos`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    // Hydration binds the toggle and compile handlers; wait before interacting.
    await page.waitForLoadState('networkidle')

    const block = page.locator('[data-showcase-block]')
    await expect(block).toHaveCount(1)
    const demo = block.locator('[data-showcase-demo]').first()
    await expect(demo).toBeVisible()

    // The props table appends a Value column (scoped: a docs demo like
    // FieldTable may render its own Value column in the demo region), and the
    // title row hosts the code toggle.
    await expect(
      page.getByRole('region', { name: 'Props' }).getByRole('columnheader', { name: 'Value' }),
    ).toBeVisible()
    const titlebar = page.locator('[data-showcase-titlebar]')
    const toggle = titlebar.getByRole('button', { name: 'Show code' })
    await expect(toggle).toHaveCount(1)

    // Opening Show code compiles the seed, which reproduces the static demo
    // with no inline error.
    const before = normalizeDemoText(await demo.textContent())
    await toggle.click()
    await expect(page.getByRole('region', { name: 'Code' }).locator('.cm-content')).toBeVisible()
    await expect.poll(async () => normalizeDemoText(await demo.textContent()), { timeout: 15000 }).toBe(before)
    await expect(page.locator('main').getByRole('alert')).toHaveCount(0)

    // Closing restores the static demo and tears the code editor down. Scope
    // to the shell's Code region: a code-editor demo renders its own
    // `.cm-content` inside the demo and would defeat a page-wide count.
    await titlebar.getByRole('button', { name: 'Hide code' }).click()
    await expect(page.getByRole('region', { name: 'Code' })).toHaveCount(0)
    expect(normalizeDemoText(await demo.textContent())).toBe(before)
  })
}

// Converted showcase pages own a `SnippetPreview` and hand their `fields` to
// the shell, which hosts the code toggle in the demo block titlebar. The
// parameterized loop above drives the registry directly; this static list is
// the guard that a page added without a Value-column preview is caught rather
// than silently losing its snippet coverage. Keep it in step with the pages
// that pass a preview plus a Value column.
const CONVERTED_PAGE_SLUGS = [
  'app-shell',
  'autocomplete',
  'base-dialog',
  'button',
  'buttons',
  'checkbox',
  'chip',
  'chip-dropdown',
  'code-editor',
  'column-chooser',
  'confirm-dialog',
  'copy-button',
  'copyable',
  'data-grid',
  'data-table',
  'date-range-picker',
  'edit-dialog',
  'editable-text',
  'field-table',
  'form-field',
  'icons',
  'lazy-code-editor',
  'menu',
  'number-input',
  'pagination',
  'password-input',
  'resizable',
  'search-input',
  'select-dropdown',
  'spinner',
  'splitter',
  'structure-tree',
  'tabs',
  'tag-input',
  'textarea',
  'text-input',
  'toast',
  'tooltip',
]

// The converted-page list is the registry's snippet set; guard that a page
// added to one is added to the other, or its snippet coverage silently drops.
test('showcase: the converted-page list matches the component registry', () => {
  expect([...CONVERTED_PAGE_SLUGS].sort()).toEqual(
    SHOWCASE_COMPONENTS.map(component => component.slug).sort(),
  )
})

test('showcase: the reset button restores a snippet demo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, reset, and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const before = normalizeDemoText(await demo.textContent())
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()

  // Editing the snippet recompiles it and updates the section demo in place.
  await replaceSnippet(page, page.locator('main'), '<Button variant="primary">Live demo</Button>')
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 })

  // Reset restores the seed source, and the normal debounce/compile pipeline
  // recompiles it back to the initial demo. The header hosts its own Reset
  // beside the toggle, so scope to the editor's draft-reset inside the code
  // region.
  const codeRegion = page.getByRole('region', { name: 'Code' })
  await codeRegion.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible({
    timeout: 10000,
  })
  await expect(page.getByRole('button', { name: 'Live demo' })).toHaveCount(0)
  expect(normalizeDemoText(await demo.textContent())).toBe(before)
})

test('showcase: a code snippet edits its section demo in place', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, copy, and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  // The static demo paints before any compilation runs.
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()

  // The editor opens below the demo row.
  await expect(page.locator('main .cm-content').first()).toBeVisible()

  // Editing the snippet recompiles it and updates the section demo in place.
  await replaceSnippet(page, page.locator('main'), '<Button variant="primary">Live demo</Button>')
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toHaveCount(0)

  // The copy button still copies the edited source.
  await page.getByRole('button', { name: 'Copy code' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied')
  await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '<Button variant="primary">Live demo</Button>',
  )

  // Invalid source shows an inline error and keeps the current demo on screen.
  await replaceSnippet(page, page.locator('main'), '<Button variant="primary">Broken')
  await expect(page.locator('main').getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible()

  // Closing the toggle restores the static demo and clears the error.
  await page.locator('main header').getByRole('button', { name: 'Hide code' }).click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
  await expect(page.locator('main .cm-content')).toHaveCount(0)
  expect(normalizeDemoText(await demo.textContent())).toBe('Apply (0)')
})

// The Button children editor (an html code dialog) and the snippet's leading
// script-local label are two views of one value, so editing either updates
// the other.
test('showcase: the Button children editor and the snippet label stay in sync', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, dialog, and compile handlers; wait to interact.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const editChildren = page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit children' })

  // Dialog -> demo + snippet: a custom label shows on the button and seeds a
  // script-local into the editor.
  await editChildren.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, dialog, 'Ship it')
  await expect(dialog.locator('.cm-content')).toContainText('Ship it')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ship it (0)' })).toBeVisible()
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  expect(await editorContains(page, page.locator('main'), 'let label = $state("Ship it")')).toBe(true)

  // Snippet -> dialog + demo: editing the script-local updates the demo, and
  // reopening the dialog seeds from the new label.
  await replaceSnippet(
    page,
    page.locator('main'),
    [
      '<script>',
      '  let label = $state("Deploy")',
      '</script>',
      '<Button variant="primary">{label} ({clicks})</Button>',
    ].join('\n'),
  )
  await expect(page.getByRole('button', { name: 'Deploy (0)' })).toBeVisible({ timeout: 10000 })
  expect(normalizeDemoText(await demo.textContent())).toBe('Deploy (0)')
  await editChildren.click()
  await expect(page.getByRole('dialog').locator('.cm-content')).toContainText('Deploy')
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
})

// The FormField children editor commits any well-formed control/html mix:
// the demo renders each segment and the seed carries the lines verbatim. The
// eye toggle omits the children from both the demo and the seed.
test('showcase: the FormField children editor and eye toggle round-trip', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/form-field')
  // Hydration binds the toggle, dialog, and compile handlers; wait to interact.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const editChildren = page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit children' })

  // Dialog -> demo + snippet: a control with an id plus a note and text show
  // in the demo and land verbatim in the editor.
  await editChildren.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(
    page,
    dialog,
    ['<TextInput bind:value id="demo-id" />', '<span>note-123</span>', 'plain-123'].join('\n'),
  )
  await expect(dialog.locator('.cm-content')).toContainText('plain-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.locator('input#demo-id')).toBeVisible()
  await expect(demo).toContainText('note-123 plain-123')
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  expect(await editorContains(page, page.locator('main'), '<TextInput bind:value id="demo-id" />')).toBe(true)
  expect(await editorContains(page, page.locator('main'), '<span>note-123</span>')).toBe(true)
  expect(normalizeDemoText(await demo.textContent())).toContain('note-123 plain-123')

  // Eye toggle off omits the children from the demo and the seed; back on
  // restores them.
  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Unapply children' }).click()
  await expect(demo.locator('input')).toHaveCount(0)
  expect(await editorContains(page, page.locator('main'), '<TextInput')).toBe(false)
  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Apply children' }).click()
  await expect(demo.locator('input#demo-id')).toBeVisible()
})

// The Buttons children editor commits any well-formed button list: the demo
// renders each button and the seed carries the lines verbatim.
test('showcase: the Buttons children editor updates the demo and snippet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/buttons')
  // Hydration binds the toggle, dialog, and compile handlers; wait to interact.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  await expect(page.getByRole('button', { name: 'OK', exact: true })).toBeVisible()
  const editChildren = page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit children' })

  // Dialog -> demo + snippet: three buttons with mixed variants show on the
  // row and land verbatim in the editor, along with trailing text and a div.
  await editChildren.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(
    page,
    dialog,
    [
      '<Button variant="primary">Create</Button>',
      '<Button variant="outline">Reset</Button>',
      '<Button variant="danger">Delete</Button>',
      'note-123',
      '<div>boxed-123</div>',
    ].join('\n'),
  )
  await expect(dialog.locator('.cm-content')).toContainText('boxed-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('button', { name: 'Create' })).toBeVisible()
  await expect(demo.getByRole('button', { name: 'Reset' })).toBeVisible()
  await expect(demo.getByRole('button', { name: 'Delete' })).toHaveClass(/bg-rose-500/)
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  expect(await editorContains(page, page.locator('main'), '<Button variant="danger">Delete</Button>')).toBe(true)
  expect(await editorContains(page, page.locator('main'), 'note-123')).toBe(true)
  expect(await editorContains(page, page.locator('main'), '<div>boxed-123</div>')).toBe(true)
  expect(normalizeDemoText(await demo.textContent())).toBe('Create Reset Delete note-123 boxed-123')

  // Malformed markup rejects the commit instead of silently dropping it: OK
  // disables with guidance, and Reset restores the committable draft.
  await editChildren.click()
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(
    page,
    dialog,
    ['<Button variant="primary">Create</Button>', '<Button variant="banana">Reset</Button>'].join('\n'),
  )
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

// The header Reset (after the code toggle) restores every playground field to
// unset, and the demo and editor stay pinned while the props table scrolls.
test('showcase: the header Reset clears the Button playground', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const headerReset = page.locator('main header').getByRole('button', { name: 'Reset', exact: true })

  // The title row, demo, and editor scroll with the page while the props
  // table keeps its own scrollport below.
  await expect(page.locator('[data-showcase-block]')).toHaveCSS('position', 'static')
  const demo = page.locator('[data-showcase-demo]').first()

  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit children' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, dialog, 'Ship it')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ship it (0)' })).toBeVisible()
  await headerReset.click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()

  // At rest the block sits flush at the scroller top with the title one pt-6
  // below it — the page container's 24px top rhythm.
  const scroller = page.locator('main')
  const block = page.locator('[data-showcase-block]')
  const titlebar = page.locator('[data-showcase-titlebar]')
  await scroller.evaluate(el => el.scrollTo(0, 0))
  const mainBox = await scroller.boundingBox()
  await expect.poll(async () => (await block.boundingBox())?.y).toBeCloseTo(mainBox?.y ?? 0, 0)
  await expect
    .poll(async () => (await titlebar.boundingBox())?.y)
    .toBeCloseTo((mainBox?.y ?? 0) + 24, 0)

  // The body scrolls inside its own scrollport while the fixed header band
  // stays put: only tbody rows move. Scoped to the region holding the body —
  // closed dialogs leave mounted tabindex regions behind, so a bare
  // tabindex selector would match those too.
  const propsBody = page.locator(
    'section[data-showcase-props] div[tabindex="-1"]:has(tbody)',
  )
  await propsBody.evaluate(el => el.scrollTo(0, el.scrollHeight))
  await expect.poll(async () => propsBody.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  const thead = page.locator('section[data-showcase-props] thead th').first()
  const headY = (await thead.boundingBox())?.y ?? 0
  await expect.poll(async () => (await thead.boundingBox())?.y).toBeCloseTo(headY, 0)
  // Fill mode: the box takes the viewport remainder, so the page itself
  // never scrolls — no browser scrollbar.
  await scroller.evaluate(el => el.scrollTo(0, el.scrollHeight))
  expect(await scroller.evaluate(el => el.scrollTop)).toBe(0)
  expect(await scroller.evaluate(el => el.scrollHeight)).toBeLessThanOrEqual(
    (await scroller.evaluate(el => el.clientHeight)) + 1,
  )
})

// The size row round-trips named and numeric shapes between the Value column
// and the snippet.
test('showcase: the Button size Value and snippet stay in sync', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const sizeValue = page.getByRole('combobox', { name: 'size value' })
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()

  // Snippet -> Value: a named size and a numeric size both surface.
  await replaceSnippet(page, page.locator('main'), '<Button size="lg">{label} ({clicks})</Button>')
  await expect(sizeValue).toHaveValue('lg', { timeout: 10000 })
  await replaceSnippet(page, page.locator('main'), '<Button size={24}>{label} ({clicks})</Button>')
  await expect(sizeValue).toHaveValue('24', { timeout: 10000 })

  // Value -> snippet: picking a named size emits the canonical line. Clear
  // first so the panel opens pristine instead of filtered by the old value;
  // ArrowDown opens the focused control without toggling.
  await page.getByRole('button', { name: 'Clear size' }).click()
  await sizeValue.press('ArrowDown')
  await page.getByRole('option', { name: 'sm' }).click()
  expect(await editorContains(page, page.locator('main'), 'size="sm"')).toBe(true)
})

// The title-row eye toggle hides the demo in place (kept mounted, so grid
// state and any live instance survive) and restores it; the code editor and
// the props table are unaffected.
test('showcase: the header demo toggle hides and restores the demo', async ({ page }) => {
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const header = page.locator('main header')
  await expect(demo).toBeVisible()

  await header.getByRole('button', { name: 'Hide demo' }).click()
  await expect(demo).toBeHidden()
  await expect(header.getByRole('button', { name: 'Show demo' })).toBeVisible()

  await header.getByRole('button', { name: 'Show demo' }).click()
  await expect(demo).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
})
