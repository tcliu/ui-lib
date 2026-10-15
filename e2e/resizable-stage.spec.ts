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
