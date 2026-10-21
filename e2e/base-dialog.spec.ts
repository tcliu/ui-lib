import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

test('showcase: BaseDialog page opens the dialog with content', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration attaches the click handler; wait for it before interacting.
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Dialog body content.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('showcase: the BaseDialog children eye drops and restores the body', async ({ page }) => {
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  // Unapplying removes the body from the opened dialog.
  await page.getByRole('button', { name: 'Unapply children' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Dialog body content.', { exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')

  // Reapplying restores it.
  await page.getByRole('button', { name: 'Apply children' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByText('Dialog body content.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('showcase: the BaseDialog title Value cell edits the dialog heading', async ({ page }) => {
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('textbox', { name: 'title value', exact: true }).fill('Custom heading')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Custom heading' })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('showcase: the BaseDialog children cell edits the body markup through a dialog', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Edit children' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit children' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Anything but the paragraph-plus-buttons shape blocks OK behind an error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid edit applies on OK with working dismiss buttons.
  await replaceSnippet(
    page,
    dialog,
    [
      '<p>Custom body</p>',
      '<Buttons align="right">',
      '  <Button variant="primary">Go</Button>',
      '</Buttons>',
    ].join('\n'),
  )
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const demo = page.getByRole('dialog').filter({ has: page.getByText('Custom body') })
  await expect(demo).toBeVisible()
  // A button without the dismiss marker is inert in the static demo.
  await demo.getByRole('button', { name: 'Go' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await page.keyboard.press('Escape')
})

test('showcase: the BaseDialog children dialog supports custom button handlers', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const alerts: string[] = []
  page.on('dialog', alert => {
    alerts.push(alert.message())
    void alert.dismiss()
  })
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Edit children' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit children' }) })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(
    page,
    dialog,
    [
      '<p>Custom body</p>',
      '<Buttons align="right">',
      `  <Button variant="primary" onClick={() => alert('hi')}>Go</Button>`,
      '</Buttons>',
    ].join('\n'),
  )
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const demo = page.getByRole('dialog').filter({ has: page.getByText('Custom body') })
  await expect(demo).toBeVisible()
  await demo.getByRole('button', { name: 'Go' }).click()
  await expect.poll(() => alerts.length, { timeout: 5000 }).toBe(1)
  await expect(alerts[0]).toBe('hi')
  await page.keyboard.press('Escape')
})

test('showcase: the picker toggle hides and shows the component pane', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration binds the toggle handler; wait for it before interacting.
  await page.waitForLoadState('networkidle')
  const toggle = page.getByRole('button', { name: 'Toggle component picker' })
  const search = page.getByRole('searchbox', { name: 'Search components' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(search).toBeVisible()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(search).toBeHidden()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(search).toBeVisible()
})

test('showcase: the component pane floats above content on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 800 })
  await page.goto('/components/base-dialog')
  // Hydration binds the drawer handlers; the docked slide-in (200ms) must
  // also settle before measuring boxes.
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  const search = page.getByRole('searchbox', { name: 'Search components' })
  const backdrop = page.getByRole('button', { name: 'Close pane' })
  await expect(search).toBeVisible()
  await expect(backdrop).toBeVisible()
  // The floating overlay contains focus: the main column is inert behind it.
  await expect(page.locator('main')).toHaveAttribute('inert', '')
  // The overlay's own surface is opaque, so content behind the pane never
  // shows through its body around the controls.
  await expect(page.locator('[data-drawer-presentation="floating"]')).not.toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  )

  // Floating removes the pane from the flow: it overlaps the main column
  // instead of squeezing beside it.
  const paneBox = await search.boundingBox()
  const headingBox = await page.getByRole('heading', { level: 1, name: 'BaseDialog' }).boundingBox()
  expect(paneBox).not.toBeNull()
  expect(headingBox).not.toBeNull()
  expect(paneBox!.x + paneBox!.width).toBeGreaterThan(headingBox!.x)

  // Escape closes the overlay, returns focus to the main column, and lifts
  // its inert state.
  await page.keyboard.press('Escape')
  await expect(search).toBeHidden()
  await expect(backdrop).toBeHidden()
  await expect(page.locator('main')).not.toHaveAttribute('inert', '')
  await expect(page.locator('main')).toBeFocused()

  // The header toggle reopens the drawer.
  await page.getByRole('button', { name: 'Toggle component picker' }).click()
  await expect(search).toBeVisible()
  await expect(backdrop).toBeVisible()
})

test('showcase: the component pane docks beside content on wide viewports', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close pane' })).toHaveCount(0)
  // The pane is docked in the flow, not overlaying.
  await expect(page.locator('[data-drawer-presentation="docked"]')).toHaveCount(1)

  // Docked shares the row: the pane ends where the main column begins.
  const paneBox = await page.locator('aside').boundingBox()
  const mainBox = await page.locator('main').boundingBox()
  expect(paneBox).not.toBeNull()
  expect(mainBox).not.toBeNull()
  expect(Math.abs(paneBox!.x + paneBox!.width - mainBox!.x)).toBeLessThanOrEqual(2)
  // The wrapper owns the explicit pane width, so the fixed-size aside can
  // never overflow it (content-dependent intrinsic sizing once let the
  // aside's border cross into the main column on narrower font metrics).
  const wrapperBox = await page.locator('[data-drawer-presentation="docked"]').boundingBox()
  expect(wrapperBox).not.toBeNull()
  expect(Math.abs(wrapperBox!.width - paneBox!.width)).toBeLessThanOrEqual(1)
})

test('showcase: the BaseDialog header cell edits the Copyable title through a dialog applied by the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Edit header' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit header' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Anything but the single Copyable line blocks OK behind an error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid edit applies on OK; the opened dialog shows the Copyable title.
  await replaceSnippet(page, dialog, '<Copyable text="$.user"><span>$.user</span></Copyable>')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const demo = page.getByRole('dialog')
  await expect(demo.getByText('$.user', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  // Unapplying restores the plain title heading.
  await page.getByRole('button', { name: 'Unapply header' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Dialog title' })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('showcase: committing the canonical header keeps the snippet in Show-code', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  // Committing the seeded canonical markup is a no-op edit: the eye applies
  // and the seed keeps the snippet instead of dropping it.
  await page.getByRole('button', { name: 'Edit header' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit header' }) })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)

  await page.getByRole('button', { name: 'Show code' }).click()
  const editor = page.locator('main .cm-content').first()
  await expect(editor).toBeVisible({ timeout: 15000 })
  await expect(editor).toContainText('{#snippet header()}')
  await expect(editor).toContainText('<Copyable text="Dialog title">')
})

test('showcase: a custom title survives compiling with the header applied', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/base-dialog')
  await page.waitForLoadState('networkidle')

  await page.getByRole('textbox', { name: 'title value', exact: true }).fill('Custom heading')
  await page.getByRole('button', { name: 'Edit header' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit header' }) })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)

  // Compiling the seed must not wipe the ignored title: unapplying the eye
  // restores the custom heading.
  await page.getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(1000)
  await expect(page.getByRole('textbox', { name: 'title value', exact: true })).toHaveValue('Custom heading')
  await page.getByRole('button', { name: 'Hide code' }).click()
  await page.getByRole('button', { name: 'Unapply header' }).click()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Custom heading' })).toBeVisible()
  await page.keyboard.press('Escape')
})
