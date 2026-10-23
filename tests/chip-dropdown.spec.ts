import { expect, test } from '@playwright/test'
import { replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

test('showcase: ChipDropdown hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/chip-dropdown')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const toggle = showCodeToggle(page)

  await expect(page.getByRole('heading', { level: 2, name: 'ChipDropdown' })).toBeVisible()
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

test('showcase: ChipDropdown search selects its text with Shift+Home', async ({ page }) => {
  await page.goto('/components/chip-dropdown')
  // Hydration binds the playground controls; wait before interacting.
  await page.waitForLoadState('networkidle')

  // Turn on the filterable search field via the Value column. The checkbox
  // input is `sr-only` under its label, so force the check.
  await page.getByRole('checkbox', { name: 'filterable value' }).check({ force: true })

  // Open the chip menu; the header search input mounts and takes focus. The
  // trigger sits under the stage's bottom resize handle, so open it from the
  // keyboard (pointer clicks hit the overlay).
  await page.getByRole('button', { name: 'Set status' }).focus()
  await page.keyboard.press('Enter')
  const search = page.getByRole('combobox', { name: 'Search' })
  await expect(search).toBeVisible()

  await search.fill('act')
  await expect(search).toHaveValue('act')
  const highlight = await search.getAttribute('aria-activedescendant')

  // Shift+Home belongs to the text field: it selects the whole query and must
  // not move the list highlight.
  await page.keyboard.press('Shift+Home')
  const selection = await search.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])
  expect(selection).toEqual([0, 3])
  await expect(search).toHaveAttribute('aria-activedescendant', highlight ?? '')

  // Plain ArrowDown still drives the list highlight.
  await page.keyboard.press('ArrowDown')
  await expect(search).toHaveAttribute('aria-activedescendant', /-option-\d+/)
})

test('showcase: the ChipDropdown options cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/chip-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  await page.getByRole('button', { name: 'Edit options' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit options' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Valid JSON applies on OK and the demo follows the new options.
  await replaceSnippet(page, '[{"value": "on", "label": "On"}, {"value": "off"}]', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  // `active` matches nothing now, so the chip falls back to the raw value.
  await expect(demo).toContainText('active')
})

test('showcase: the ChipDropdown keeps its size when cleared', async ({ page }) => {
  await page.goto('/components/chip-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const chip = demo.locator('div.relative.inline-flex').first()
  const trigger = page.getByRole('combobox', { name: 'Set status' })

  // Turn on clearable via the props table.
  await page.getByRole('checkbox', { name: 'clearable value' }).check({ force: true })
  await expect(trigger).toBeVisible()

  const clear = demo.getByRole('button', { name: 'Clear', exact: true })
  await expect(clear).toBeVisible()

  const before = (await chip.boundingBox())!
  const pillBefore = (await trigger.boundingBox())!

  // Dispatch the click directly: the stage's bottom resize handle overlaps the
  // chip and would swallow a coordinate-based click.
  await clear.evaluate((el: HTMLButtonElement) => el.click())
  await expect(demo.getByRole('button', { name: 'Clear', exact: true })).toHaveCount(0)

  const after = (await chip.boundingBox())!
  const pillAfter = (await trigger.boundingBox())!
  // Both the row and the pill stay put: the cleared label holds its width and
  // the reserved clear slot keeps the cross's space.
  expect(Math.round(after.width)).toBe(Math.round(before.width))
  expect(Math.round(after.height)).toBe(Math.round(before.height))
  expect(Math.round(pillAfter.width)).toBe(Math.round(pillBefore.width))
  expect(Math.round(pillAfter.height)).toBe(Math.round(pillBefore.height))
})

test('showcase: the ChipDropdown options eye resets to the defaults', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/chip-dropdown')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // Commit custom options through the dialog.
  await page.getByRole('button', { name: 'Edit options' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit options' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '[{"value": "on", "label": "On"}, {"value": "off"}]', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  // `active` matches nothing now, so the chip falls back to the raw value.
  await expect(demo).toContainText('active')

  // Unapplying resets to the default options; the chip resolves the label.
  await page.getByRole('button', { name: 'Unapply options' }).click()
  await expect(demo).toContainText('Active')
})
