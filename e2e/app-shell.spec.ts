import { expect, test } from '@playwright/test'

test('showcase: the AppShell demo opens a floating right drawer', async ({ page }) => {
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = page.getByRole('region', { name: 'Default' })
  await expect(demo.getByText('Components', { exact: true })).toBeVisible()
  const rightPane = () => page.getByRole('complementary', { name: 'Right pane' })

  // Enabling the right pane docks it beside the demo content (desktop).
  await page.getByRole('combobox', { name: 'Right pane' }).click()
  await page.getByRole('option', { name: 'Open' }).click()
  const customized = page.getByRole('region', { name: 'Customized' })
  await expect(rightPane()).toBeVisible()
  await expect(customized.locator('[data-drawer-presentation="docked"]')).toHaveCount(2)

  // Let the docked pane's slide-in finish so every measurement below is the
  // settled layout, not a mid-transition frame.
  await page.waitForTimeout(400)

  // The right pane is anchored to the row's right edge, so its splitter sits
  // on the pane's left edge and drags the width the opposite way from a left
  // pane. Dragging left must widen the pane (move its left edge left) so the
  // handle stays under the cursor.
  const rightWrapper = customized.locator('[data-drawer-presentation="docked"]').last()
  const rightHandle = rightWrapper.locator(':scope > [role="separator"]')
  await expect(rightHandle).toBeVisible()
  const paneLeft = async () => (await rightPane().boundingBox())!.x
  const beforeLeft = await paneLeft()
  const handleBox = await rightHandle.boundingBox()
  expect(handleBox).not.toBeNull()
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox!.x - 80, handleBox!.y + handleBox!.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(200)
  const widenedLeft = await paneLeft()
  expect(widenedLeft).toBeLessThan(beforeLeft - 40)

  // Arrow keys move the handle the way the key points, not merely the value.
  await rightHandle.focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
  expect(await paneLeft()).toBeGreaterThan(widenedLeft + 5)

  // Home/End jump to the track's ends: for the right pane Home widens it (the
  // handle moves to the row's left edge) and End narrows it, mirroring the
  // pointer instead of running the handle the wrong way.
  await rightHandle.focus()
  const beforeHome = await paneLeft()
  await page.keyboard.press('Home')
  await page.waitForTimeout(200)
  const homeLeft = await paneLeft()
  expect(homeLeft).toBeLessThan(beforeHome - 5)
  await page.keyboard.press('End')
  await page.waitForTimeout(200)
  expect(await paneLeft()).toBeGreaterThan(homeLeft + 5)

  // Pinning floating mode overlays both drawers behind one backdrop.
  await page.getByRole('combobox', { name: 'Drawer mode' }).click()
  await page.getByRole('option', { name: 'Floating' }).click()
  await expect(customized.getByRole('button', { name: 'Close pane' })).toBeVisible()
  // The docked panes slide out (200ms); wait until they detach so later
  // assertions never catch a mid-transition duplicate.
  await expect(customized.locator('[data-drawer-presentation="docked"]')).toHaveCount(0)

  // Escape closes the right drawer first, then the left one.
  await page.keyboard.press('Escape')
  await expect(rightPane()).toBeHidden()
  await expect(customized.getByText('Components', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(customized.getByRole('button', { name: 'Close pane' })).toHaveCount(0)
  await expect(customized.getByText('Components', { exact: true })).toHaveCount(0)
})
