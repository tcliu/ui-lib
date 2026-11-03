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

// The Buttons children editor commits any well-formed button list: the demo
// renders each button and the seed carries the lines verbatim.
test('showcase: the Buttons children editor updates the demo and snippet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/buttons')
  // Hydration binds the toggle, dialog, and compile handlers; wait to interact.
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  await expect(page.getByRole('button', { name: 'OK', exact: true })).toBeVisible()
  const editChildren = showcaseProps(page).getByRole('button', { name: 'Edit children' })

  // Dialog -> demo + snippet: three buttons with mixed variants show on the
  // row and land verbatim in the editor, along with trailing text and a div.
  await editChildren.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(
    page,
    [
      '<Button variant="primary">Create</Button>',
      '<Button variant="outline">Reset</Button>',
      '<Button variant="danger">Delete</Button>',
      'note-123',
      '<div>boxed-123</div>',
    ].join('\n'),
    dialog,
  )
  await expect(dialog.locator('.cm-content')).toContainText('boxed-123')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('button', { name: 'Create' })).toBeVisible()
  await expect(demo.getByRole('button', { name: 'Reset' })).toBeVisible()
  await expect(demo.getByRole('button', { name: 'Delete' })).toHaveClass(/bg-rose-500/)
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, '<Button variant="danger">Delete</Button>')).toBe(true)
  expect(await editorContains(page, 'note-123')).toBe(true)
  expect(await editorContains(page, '<div>boxed-123</div>')).toBe(true)
  expect(normalizeDemoText(await demo.textContent())).toBe('Create Reset Delete note-123 boxed-123')

  // Malformed markup rejects the commit instead of silently dropping it: OK
  // disables with guidance, and Reset restores the committable draft.
  await editChildren.click()
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(
    page,
    ['<Button variant="primary">Create</Button>', '<Button variant="banana">Reset</Button>'].join('\n'),
    dialog,
  )
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

// The Buttons size row drives the gap between the demo's buttons and lands in
// the snippet, so Show-code reproduces the demo.
test('showcase: the Buttons size Value cell scales the gap and lands in the snippet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/buttons')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  // The row carries `shrink-0`; nothing else in the demo does.
  const row = demo.locator('div.shrink-0').first()

  // md = 16px dimension → the gap-2 step (8px).
  await expect(row).toHaveCSS('row-gap', '8px')

  await page.getByRole('combobox', { name: 'size value' }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 9px gap.
  await expect(row).toHaveCSS('row-gap', '9px')

  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'size="lg"')).toBe(true)
})

// The Buttons config-panel size preset drives the row's gap and the size of
// every button in it, and both land in the snippet.
test('showcase: the Buttons size preset scales the row and its buttons', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/buttons')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  // The row carries `shrink-0`; nothing else in the demo does.
  const row = demo.locator('div.shrink-0').first()

  // The preset starts on the md step.
  await expect(page.getByRole('combobox', { name: 'Size', exact: true })).toHaveValue('md')

  // md = 16px dimension → the gap-2 step (8px) and a 13px button label.
  await expect(row).toHaveCSS('row-gap', '8px')
  await expect(demo.getByRole('button', { name: 'OK', exact: true })).toHaveCSS('font-size', '13px')

  await page.getByRole('combobox', { name: 'Size', exact: true }).click()
  await page.getByRole('option', { name: 'lg' }).click()

  // lg = 18px dimension → a 9px gap and a 14.625px button label.
  await expect(row).toHaveCSS('row-gap', '9px')
  await expect(demo.getByRole('button', { name: 'OK', exact: true })).toHaveCSS('font-size', '14.625px')

  // The snippet carries the size on the row and on each button.
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, '<Buttons size="lg">')).toBe(true)
  expect(await editorContains(page, '<Button size="lg" variant="primary">')).toBe(true)
})
