import { expect, test } from '@playwright/test'
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components'
import { DEMO_CONTROLS, PRESENTATIONAL_SLUGS } from './helpers'

for (const { slug, name } of SHOWCASE_COMPONENTS) {
  test(`showcase: ${name} page renders its demo`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    const demo = page.locator('main')
    const rendered = PRESENTATIONAL_SLUGS.has(slug) ? demo.locator('svg').first() : demo.locator(DEMO_CONTROLS).first()
    await expect(rendered).toBeVisible()
  })
}
