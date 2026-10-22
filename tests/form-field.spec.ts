import { expect, test } from '@playwright/test'
import {
  editorContains,
  normalizeDemoText,
  replaceSnippet,
  showCodeToggle,
  showcaseDemo,
  showcaseProps,
  snippetEditor,
} from './helpers'

test('showcase: the FormField size Value cell scales the label', async ({ page }) => {
  await page.goto('/components/form-field')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await page.getByRole('combobox', { name: 'size value' }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 15.75px label on the field wrapper.
  await expect(demo.locator('[style*="--ff-font"]').first()).toHaveAttribute('style', /--ff-font:\s*15\.75px/)
})

// The FormField children editor commits any well-formed control/html mix:
// the demo renders each segment and the seed carries the lines verbatim. The
// eye toggle omits the children from both the demo and the seed.
test('showcase: the FormField children editor and eye toggle round-trip', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/form-field')
  // Hydration binds the toggle, dialog, and compile handlers; wait to interact.
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const editChildren = showcaseProps(page).getByRole('button', { name: 'Edit children' })

  // Dialog -> demo + snippet: a control with an id plus a note and text show
  // in the demo and land verbatim in the editor.
  await editChildren.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(
    page,
    ['<TextInput bind:value id="demo-id" />', '<span>note-123</span>', 'plain-123'].join('\n'),
    dialog,
  )
  await expect(dialog.locator('.cm-content')).toContainText('plain-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.locator('input#demo-id')).toBeVisible()
  await expect(demo).toContainText('note-123 plain-123')
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, '<TextInput bind:value id="demo-id" />')).toBe(true)
  expect(await editorContains(page, '<span>note-123</span>')).toBe(true)
  expect(normalizeDemoText(await demo.textContent())).toContain('note-123 plain-123')

  // Eye toggle off omits the children from the demo and the seed; back on
  // restores them.
  await showcaseProps(page).getByRole('button', { name: 'Unapply children' }).click()
  await expect(demo.locator('input')).toHaveCount(0)
  expect(await editorContains(page, '<TextInput')).toBe(false)
  await showcaseProps(page).getByRole('button', { name: 'Apply children' }).click()
  await expect(demo.locator('input#demo-id')).toBeVisible()
})
