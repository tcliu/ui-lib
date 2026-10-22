import { expect, test } from '@playwright/test'

// The DataGrid demo fills a bounded pane and is intentionally not
// width-resizable: its stage renders without a drag handle, so the grid keeps
// the full row (unlike resizable stages, which narrow the demo to inspect
// tight containers).
test('showcase: the data-grid demo stage has no resize handle', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.goto('/components/data-grid')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  // Anchor on the shell's demo hook, not DOM nesting, and prove the demo
  // rendered before asserting the absence so a missing demo cannot pass
  // vacuously.
  const demo = page.locator('[data-showcase-demo]').first()
  await expect(demo).toBeVisible()
  await expect(demo.locator('[role="separator"]')).toHaveCount(0)
})

// The stage frame must not clip the component it wraps: the pane carries no
// padding, so the demo's first control sits flush at the frame's corner and its
// focus ring is drawn outside the border box. The host still clips what
// outgrows the frame, but keeps the shared clip margin, so the ring survives.
test('showcase: the stage frame clips with a margin around a flush demo', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const widthHandle = demo.getByRole('separator', { name: 'Resize width', exact: true })
  // The frame is the handle's parent; the host that clips the frame is its.
  const host = widthHandle.locator('../..')
  const trigger = demo.getByRole('button', { name: 'More actions' })
  await expect(trigger).toBeVisible()

  // The control sits at the container's origin, so the margin is the only thing
  // keeping its focus ring off the clip boundary.
  const hostBox = await host.boundingBox()
  const triggerBox = await trigger.boundingBox()
  expect(hostBox).not.toBeNull()
  expect(triggerBox).not.toBeNull()
  expect(triggerBox!.x - hostBox!.x).toBeCloseTo(0, 1)
  expect(triggerBox!.y - hostBox!.y).toBeCloseTo(0, 1)

  const clip = await host.evaluate(element => {
    const style = getComputedStyle(element)
    return { overflow: `${style.overflowX} ${style.overflowY}`, margin: parseFloat(style.overflowClipMargin) }
  })
  expect(clip.overflow).toBe('clip clip')
  // Wide enough for the widest focus indicator the library draws (a 2px ring,
  // or a 2px outline offset by 1px).
  expect(clip.margin).toBeGreaterThanOrEqual(3)
})

// The handles are invisible cursor-only hit areas, so a stage frame is
// pointer-only: they stay out of the tab order and tabbing through a demo never
// stops on an unmarked block. The Resizable page, whose subject is keyboard
// resizing, keeps its handles tabbable (see resizable.spec.ts).
test('showcase: the stage keeps its resize handles out of the tab order', async ({ page }) => {
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const trigger = demo.getByRole('button', { name: 'More actions' })
  await expect(demo.getByRole('separator', { name: 'Resize width', exact: true })).toHaveAttribute(
    'tabindex',
    '-1',
  )

  // Focus inside the frame does not open them: the next Tab leaves the demo
  // instead of landing on a handle.
  await trigger.focus()
  await page.keyboard.press('Tab')
  for (const name of ['Resize width', 'Resize height', 'Resize width and height']) {
    await expect(demo.getByRole('separator', { name, exact: true })).not.toBeFocused()
  }
})
