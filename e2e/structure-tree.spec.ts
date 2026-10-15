import { expect, test } from '@playwright/test'
import { editorContains, normalizeDemoText, replaceSnippet } from './helpers'

// StructureTree follows the converted showcase layout: the code toggle sits
// beside the component title and the props table appends an editable Value
// column. The demo tree starts from the default nodes with editing wired.
test('showcase: StructureTree hosts its code toggle in the title row beside a Value column', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button', { name: 'Show code' })

  await expect(page.getByRole('heading', { level: 1, name: 'StructureTree' })).toBeVisible()
  await expect(toggle).toHaveCount(1)
  await expect(demo).toContainText('Ada Lovelace')

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the snippet, which reproduces the demo.
  const before = normalizeDemoText(await demo.textContent())
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => normalizeDemoText(await demo.textContent()), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the StructureTree value cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('Ada Lovelace')

  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid document applies on OK and the demo follows it.
  await replaceSnippet(page, dialog, '{"ship": "it"}')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).toContainText('ship')
  await expect(demo).not.toContainText('Ada Lovelace')

  // The Show-code seed regenerates from the committed value.
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  expect(await editorContains(page, page.locator('main'), '"ship":"it"')).toBe(true)
})

test('showcase: editing a StructureTree leaf updates the demo in place', async ({ page }) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('Ada Lovelace')

  await demo.getByRole('button', { name: 'Edit $.role' }).click()
  const input = demo.getByRole('textbox').first()
  await expect(input).toBeVisible()
  await input.fill('Captain')
  await input.press('Enter')
  await expect(demo).toContainText('"Captain"')
  await expect(demo).not.toContainText('Engineer')
})

test('showcase: the StructureTree value eye resets to the default tree', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  // Commit a custom document through the dialog.
  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, dialog, '{"ship": "it"}')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo).toContainText('ship')
  await expect(demo).not.toContainText('Ada Lovelace')

  // Unapplying resets to the default tree.
  await page.getByRole('button', { name: 'Unapply value' }).click()
  await expect(demo).toContainText('Ada Lovelace')
})

test('showcase: editing a nested object through its edit dialog formats and saves', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('Ada Lovelace')

  // Container headers carry a hover edit button, including the root.
  await expect(demo.getByRole('button', { name: 'Edit $.address' })).toHaveCount(1)
  await expect(demo.getByRole('button', { name: 'Edit $', exact: true })).toHaveCount(1)

  await demo.getByRole('button', { name: 'Edit $.address' }).click()
  const dialog = page.getByRole('dialog', { name: '$.address' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })

  // Compact JSON formats to two-space indent on Format.
  await replaceSnippet(page, dialog, '{"city":"Paris"}')
  await dialog.getByRole('button', { name: 'Format' }).click()
  expect(await editorContains(page, dialog, '"city": "Paris"')).toBe(true)

  // OK commits the parsed object to the node path. The node stays collapsed
  // as object{1}, so expand it to see the saved value.
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await demo.getByRole('button', { name: 'Expand address' }).click()
  await expect(demo).toContainText('Paris')
  await expect(demo).not.toContainText('London')
})

test('showcase: renaming a nested object key through double-click', async ({ page }) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toContainText('Ada Lovelace')

  await demo.getByRole('button', { name: 'address', exact: true }).dblclick()
  const input = demo.getByRole('textbox').first()
  await expect(input).toBeVisible()
  await input.fill('location')
  await input.press('Enter')
  await expect(demo).toContainText('location')
  await expect(demo).not.toContainText('address')
})

test('showcase: the StructureTree row class eyes apply and unapply without losing text', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  // The applied override class is the demo's own marker: anchor on it instead
  // of a DOM-nesting chain, and prove it is absent first so the later counts
  // cannot pass vacuously.
  const customized = demo.locator('.gap-9')
  await expect(customized).toHaveCount(0)

  // Typing a customization applies it live.
  await page
    .getByRole('textbox', { name: 'containerRowClass value', exact: true })
    .fill('gap-9 rounded py-1 hover:bg-slate-800/40')
  await expect(customized.first()).toBeVisible()

  // Unapplying drops it from the demo while the committed text stays.
  await page.getByRole('button', { name: 'Unapply containerRowClass' }).click()
  await expect(customized).toHaveCount(0)

  // Re-applying restores it without retyping.
  await page.getByRole('button', { name: 'Apply containerRowClass' }).click()
  await expect(customized.first()).toBeVisible()
})
