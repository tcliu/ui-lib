import { expect, test } from '@playwright/test'

// The Resizable demo renders a controlled container with invisible resize
// zones on its right edge, bottom edge, and corner: hovering shows only the
// resize cursor, and dragging resizes the container.
test('showcase: the resizable demo resizes from its cursor-only edges', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.goto('/components/resizable')
  await page.waitForLoadState('networkidle')
  const section = page.locator('[data-showcase-demo]').first()
  const widthHandle = section.getByRole('separator', { name: 'Resize width', exact: true })
  const bothHandle = section.getByRole('separator', { name: 'Resize width and height', exact: true })
  const container = widthHandle.locator('..')
  await expect(container).toBeVisible()

  // The handles carry no visible grip: only the resize cursor marks them.
  await expect(widthHandle.locator('span')).toHaveCount(0)
  await expect
    .poll(async () => widthHandle.evaluate(element => getComputedStyle(element).cursor))
    .toBe('e-resize')
  await expect
    .poll(async () => bothHandle.evaluate(element => getComputedStyle(element).cursor))
    .toBe('nwse-resize')

  // Dragging the corner grows both axes.
  const box = await bothHandle.boundingBox()
  expect(box).not.toBeNull()
  const size = () => container.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight }))
  const before = await size()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + 80, box!.y + 60, { steps: 10 })
  await page.mouse.up()
  const dragged = await size()
  expect(dragged.width).toBeGreaterThan(before.width + 50)
  expect(dragged.height).toBeGreaterThan(before.height + 30)

  // The width handle stays keyboard-operable.
  await widthHandle.focus()
  await page.keyboard.press('ArrowRight')
  const grown = await size()
  expect(grown.width).toBeGreaterThan(dragged.width)

  // Widening past the row scrolls the demo wrapper instead of squeezing the box.
  const scroller = widthHandle.locator('../..')
  const presses = await scroller.evaluate(
    element => Math.ceil((element.clientWidth - 320 + 50) / 16),
  )
  await widthHandle.focus()
  for (let index = 0; index < presses; index += 1) {
    await page.keyboard.press('ArrowRight')
  }
  await expect.poll(async () => scroller.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
  // The box itself is not squeezed: its rendered width matches the grown value.
  const sizeText = (await container.getByText('×').textContent()) ?? ''
  const labelledWidth = Number(sizeText.split('×')[0])
  const renderedWidth = await container.evaluate(element => element.clientWidth)
  expect(renderedWidth).toBeGreaterThanOrEqual(labelledWidth - 1)

  // Enlarging past the max height scrolls the wrapper vertically instead of
  // growing the page.
  await bothHandle.focus()
  for (let index = 0; index < 30; index += 1) {
    const overflowing = await scroller.evaluate(element => element.scrollHeight > element.clientHeight)
    if (overflowing) break
    await page.keyboard.press('ArrowDown')
  }
  await expect.poll(async () => scroller.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
})
