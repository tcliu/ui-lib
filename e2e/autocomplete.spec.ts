import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

// AutoComplete is a converted showcase page: the code toggle sits in the page
// title row, the demo renders inside a `Resizable` stage, and the props table
// adds an editable Value column. Like SelectDropdown it gets its own spec
// rather than leaning on the per-section snippets loop.
test('showcase: AutoComplete hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/autocomplete')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button', { name: 'Show code' })

  await expect(page.getByRole('heading', { level: 1, name: 'AutoComplete' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a resizable frame. Resizable renders its width, height,
  // and corner handles unconditionally.
  await expect(demo.locator('[role="separator"]')).toHaveCount(3)
  // The field renders as a combobox text input.
  await expect(demo.locator('input[role="combobox"]')).toHaveCount(1)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the AutoComplete live demo filters and accepts a suggestion', async ({ page }) => {
  await page.goto('/components/autocomplete')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  // Wait out the initial compile so the live instance is mounted.
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('value: Two')

  // Typing narrows the suggestion list to the matching options.
  const input = demo.locator('input[role="combobox"]')
  await input.click()
  await input.fill('Th')
  // The suggestion panel is portalled to `body`, outside the demo container.
  const options = page.locator('[role="listbox"] [role="option"]')
  await expect(options).toHaveCount(2)
  await expect(options.first()).toHaveText('Three')

  // Enter accepts the active suggestion: the bound value becomes its label.
  await input.press('Enter')
  await expect
    .poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 })
    .toBe('value: Three')
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the AutoComplete options eye resets to the defaults', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/autocomplete')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const input = demo.locator('input[role="combobox"]')
  const options = page.locator('[role="listbox"] [role="option"]')

  // Commit a single custom option through the dialog.
  await page.getByRole('button', { name: 'Edit options' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit options' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, dialog, '["solo"]')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await input.click()
  await input.fill('so')
  await expect(options).toHaveCount(1)
  await expect(options.first()).toHaveText('solo')

  // Unapplying resets to the default options.
  await page.getByRole('button', { name: 'Unapply options' }).click()
  await input.click()
  await input.fill('Twe')
  await expect(options).toHaveCount(2)
  await expect(options.first()).toHaveText('Twelve')
})
