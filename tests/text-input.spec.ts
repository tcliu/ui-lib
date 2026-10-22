import { expect, test } from '@playwright/test'
import { replaceSnippet, showcaseDemo } from './helpers'

// TextInput follows the converted showcase layout: the code toggle sits beside
// the component title, the props table appends an editable Value column, and a
// `clearable` field overlays a size-scaled clear cross on the field's own edge.
test('showcase: the TextInput clearable cell adds a clear cross that empties the field', async ({ page }) => {
  await page.goto('/components/text-input')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const field = demo.getByRole('textbox', { name: 'Apply' })
  const clear = demo.getByRole('button', { name: 'Clear' })

  // Off by default, and an empty field shows no cross even once enabled.
  await expect(clear).toHaveCount(0)
  // Keyboard-toggle the Value checkbox from the keyboard.
  const clearableBox = page.getByRole('checkbox', { name: 'clearable value', exact: true })
  await clearableBox.focus()
  await page.keyboard.press('Space')
  await expect(clearableBox).toBeChecked()
  await expect(clear).toHaveCount(0)

  // The inside clear reserves its gutter up front, so the text area is the same
  // width empty and filled — no reflow when the first character is typed.
  const contentWidth = () =>
    field.evaluate(
      element =>
        element.clientWidth -
        parseFloat(getComputedStyle(element).paddingLeft) -
        parseFloat(getComputedStyle(element).paddingRight),
    )
  const emptyWidth = await contentWidth()

  // A value brings the cross in; the field keeps the typed text.
  await field.fill('hello')
  await expect(clear).toBeVisible()
  await expect(field).toHaveValue('hello')
  expect(await contentWidth()).toBeCloseTo(emptyWidth, 0)

  // Clicking the cross empties the bound value, removes the cross, and returns
  // focus to the field so the caret is ready for the next entry.
  await clear.click()
  await expect(field).toHaveValue('')
  await expect(clear).toHaveCount(0)
  await expect(field).toBeFocused()
})

test('showcase: the TextInput trailer cell adds content outside the field', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/text-input')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // A trailer cell adds content outside the field area.
  await page.getByRole('button', { name: 'Edit trailer' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit trailer' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, 'USD', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.getByText('USD')).toBeVisible()
})
