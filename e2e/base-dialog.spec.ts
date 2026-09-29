import { expect, test } from '@playwright/test'

test('showcase: BaseDialog page opens the dialog with content', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration attaches the click handler; wait for it before interacting.
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByTestId('dialog-body')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
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
