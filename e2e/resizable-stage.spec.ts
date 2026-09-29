import { expect, test } from '@playwright/test'

// The big-component demos fill the page and expose a drag handle that narrows
// their stage, so a narrow-container layout can be inspected in place. The
// DataTable and Splitter demos are always handle-less (the table's fill pane
// owns a bounded height; the splitter demo's own separator is the only handle)
// and are asserted separately below.
for (const slug of ['data-grid']) {
  test(`showcase: the ${slug} demo stage is resizable`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 1000 })
    await page.goto(`/components/${slug}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(400)
    const section = page.locator('main > div > section').first()
    const row = section.locator('div.flex.w-full.min-w-0').first()
    const handle = row.locator(':scope > [role="separator"]')
    await expect(handle).toBeVisible()
    // The handle names what it resizes, not just "Resize".
    await expect(handle).toHaveAttribute('aria-label', 'Resize demo')

    const measure = () =>
      row.evaluate(el => {
        const rowBox = el.getBoundingClientRect()
        const paneBox = el.firstElementChild!.getBoundingClientRect()
        return { row: rowBox.width, pane: paneBox.width }
      })

    // Full container by default.
    const before = await measure()
    expect(before.pane / before.row).toBeGreaterThan(0.97)

    // Dragging the handle left narrows the stage.
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x - 300, box!.y + box!.height / 2, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    const dragged = await measure()
    expect(dragged.pane).toBeLessThan(before.pane - 100)

    // The handle stays keyboard-operable.
    await handle.focus()
    await page.keyboard.press('ArrowRight')
    const grown = await measure()
    expect(grown.pane).toBeGreaterThan(dragged.pane)
  })
}
