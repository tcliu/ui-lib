import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

test('showcase: ChipDropdown hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/chip-dropdown')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button')

  await expect(page.getByRole('heading', { level: 1, name: 'ChipDropdown' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a width-only resizable frame (one right-edge handle), with
  // no pane padding so its left edge lines up with the config panel below.
  await expect(demo.locator('[role="separator"]')).toHaveCount(1)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: ChipDropdown search selects its text with Shift+Home', async ({ page }) => {
  await page.goto('/components/chip-dropdown')
  // Hydration binds the playground controls; wait before interacting.
  await page.waitForLoadState('networkidle')

  // Turn on the filterable search field via the Value column. The checkbox
  // input is `sr-only` under its label, so force the check.
  await page.getByRole('checkbox', { name: 'filterable value' }).check({ force: true })

  // Open the chip menu; the header search input mounts and takes focus.
  await page.getByRole('button', { name: 'Set status' }).click()
  const search = page.getByRole('combobox', { name: 'Search…' })
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

  const demo = page.locator('[data-showcase-demo]').first()

  await page.getByRole('button', { name: 'Edit options' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit options' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // Valid JSON applies on OK and the demo follows the new options.
  await replaceSnippet(page, dialog, '[{"value": "on", "label": "On"}, {"value": "off"}]')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  // `active` matches nothing now, so the chip falls back to the raw value.
  await expect(demo).toContainText('active')
})
