import { expect, test } from '@playwright/test'
import { replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

// SelectDropdown is the one showcase page whose layout is driven by the shared
// `ShowcasePage` header (code toggle beside the title) and a borderless section
// with a `Resizable` demo stage plus a Value column in the props table, so it
// gets its own spec rather than leaning on the per-section snippets loop.
test('showcase: SelectDropdown hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/select-dropdown')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const toggle = showCodeToggle(page)

  await expect(page.getByRole('heading', { level: 1, name: 'SelectDropdown' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a resizable frame. Resizable renders its width, height,
  // and corner handles unconditionally.
  await expect(demo.locator('[role="separator"]')).toHaveCount(3)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(snippetEditor(page)).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(snippetError(page)).toHaveCount(0)
})

test('showcase: the SelectDropdown live demo follows value edits behind the open editor', async ({ page }) => {
  await page.goto('/components/select-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  // Wait out the initial compile so the live instance is mounted.
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('Two value: two')

  // The committed value is seeded as script-local state, so the edit reseeds
  // and recompiles the live instance behind the open editor.
  await page.getByRole('textbox', { name: 'activeValue value' }).fill('three')
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('Three value: three')
  // The committed value is seeded as script-local state, so the editor text
  // tracks the edit too.
  await expect(snippetEditor(page)).toContainText('let value = $state("three")')
  await expect(snippetError(page)).toHaveCount(0)
})

test('showcase: SelectDropdown snippet edits flow back into the Value column', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/select-dropdown')
  await page.waitForLoadState('networkidle')

  await showCodeToggle(page).click()
  const editor = snippetEditor(page)
  await expect(editor).toBeVisible()
  // Wait out the initial compile so the live instance is mounted.
  const demo = showcaseDemo(page)
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('Two value: two')

  // Editing the snippet writes recognized attributes back into playground
  // state: the Value cells follow while the editor keeps the typed text.
  await replaceSnippet(
    page,
    [
      '<script>',
      'let value = $state("two")',
      '</script>',
      '<SelectDropdown',
      '  activeValue={value}',
      '  ariaLabel="mini"',
      '  size="lg"',
      '  filterable',
      '  options={options}',
      '  onSelect={next => (value = next)} />',
      '<span class="text-sm text-slate-400">value: {value}</span>',
    ].join('\n'),
  )
  await expect(page.getByRole('textbox', { name: 'ariaLabel value' })).toHaveValue('mini')
  await expect(page.getByRole('checkbox', { name: 'filterable value' })).toBeChecked()
  await expect(snippetError(page)).toHaveCount(0)
})

test('showcase: the SelectDropdown Value column edits the live demo', async ({ page }) => {
  await page.goto('/components/select-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  // The default demo is a non-filterable trigger (a button combobox).
  await expect(demo.locator('button[role="combobox"]')).toHaveCount(1)

  // Ticking the filterable Value checkbox swaps it for a filterable input.
  // The checkbox input is `sr-only` under its label, so force the check.
  await page.getByRole('checkbox', { name: 'filterable value' }).check({ force: true })
  await expect(demo.locator('input[role="combobox"]')).toHaveCount(1)
})

test('showcase: the SelectDropdown options and activeValue cells edit the live demo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/select-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // The activeValue cell edits the committed value as plain text.
  await page.getByRole('textbox', { name: 'activeValue value' }).fill('four')
  await expect(demo).toContainText('Four value: four')

  // The options cell edits the array as JSON through an edit dialog.
  await page.getByRole('button', { name: 'Edit options' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit options' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()
  await expect(ok).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Valid JSON applies on OK and the demo follows the new options.
  await replaceSnippet(page, '["eins", {"value": "zwei", "label": "Zwei"}]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  // `four` matches nothing now, so the trigger falls back to the raw value.
  await expect(demo).toContainText('four value: four')
})

test('showcase: the SelectDropdown options eye resets to the defaults', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/select-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // Commit custom options through the dialog.
  await page.getByRole('button', { name: 'Edit options' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit options' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '["eins", {"value": "zwei", "label": "Zwei"}]', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  // `two` matches nothing now, so the trigger falls back to the raw value.
  await expect(demo).toContainText('two value: two')

  // Unapplying resets to the default options; the trigger resolves the label.
  await page.getByRole('button', { name: 'Unapply options' }).click()
  await expect(demo).toContainText('Two value: two')

  // Committing re-applies the eye.
  await page.getByRole('button', { name: 'Edit options' }).click()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '["eins"]', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo).toContainText('two value: two')
})

test('showcase: double-clicking the filterable SelectDropdown selects the whole value', async ({ page }) => {
  await page.goto('/components/select-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  // Ticking filterable swaps the trigger button for the combobox input.
  await page.getByRole('checkbox', { name: 'filterable value' }).check({ force: true })
  const input = demo.locator('input[role="combobox"]')
  await expect(input).toHaveValue('Two')

  // The double-click selects the whole value rather than the browser's single
  // word, so the next keystroke replaces the filter.
  await input.dblclick()
  expect(
    await input.evaluate(el => [(el as HTMLInputElement).selectionStart, (el as HTMLInputElement).selectionEnd]),
  ).toEqual([0, 3])

  await page.keyboard.type('One')
  await expect(input).toHaveValue('One')
  await page.keyboard.press('Enter')
  // The typed replacement committed as the new value (the input's own text is
  // not part of the demo's innerText).
  await expect(demo).toContainText('value: one')
})
