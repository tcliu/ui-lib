import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

// `openChart` returns the demo hook plus the chart image, so each test anchors
// on the same accessible name instead of repeating the navigation.
async function openChart(page: import('@playwright/test').Page) {
  await page.goto('/components/bar-chart')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const plot = demo.getByRole('img', { name: 'Daily activity' })
  await expect(plot).toBeVisible()
  return { demo, plot }
}

test('showcase: the BarChart renders its axis and summed legend', async ({ page }) => {
  const { demo } = await openChart(page)
  await expect(demo.getByText('Mon', { exact: true })).toBeVisible()
  // Sessions 8+12+6+15+10 = 51, Retries 3+4+2+5+3 = 17.
  await expect(demo.getByText('Sessions 51', { exact: true })).toBeVisible()
  await expect(demo.getByText('Retries 17', { exact: true })).toBeVisible()
})

test('showcase: the ariaLabel Value cell renames the chart image', async ({ page }) => {
  const { demo } = await openChart(page)
  await page.getByRole('textbox', { name: 'ariaLabel value', exact: true }).fill('Weekly activity')
  await expect(demo.getByRole('img', { name: 'Weekly activity' })).toBeVisible()
})

test('showcase: the size Value cell scales the plot', async ({ page }) => {
  const { plot } = await openChart(page)
  // md: 16 × 8.75 = 140px.
  await expect.poll(() => plot.evaluate(el => getComputedStyle(el).height)).toBe('140px')
  await page.getByRole('combobox', { name: 'size value', exact: true }).press('ArrowDown')
  await page.getByRole('option', { name: 'xl', exact: true }).click()
  // xl: 20 × 8.75 = 175px.
  await expect.poll(() => plot.evaluate(el => getComputedStyle(el).height)).toBe('175px')
})

test('showcase: the height Value cell overrides the plot footprint', async ({ page }) => {
  const { plot } = await openChart(page)
  await page.getByRole('textbox', { name: 'height value', exact: true }).fill('240')
  await expect.poll(() => plot.evaluate(el => getComputedStyle(el).height)).toBe('240px')
})

test('showcase: applying the legend Value and turning it off hides the legend', async ({ page }) => {
  const { demo } = await openChart(page)
  const legendToggle = page.getByRole('checkbox', { name: 'legend value', exact: true })
  await page.getByRole('button', { name: 'Apply legend', exact: true }).click()
  // The checkbox input is clipped behind its label's hit area, so toggle it
  // from the keyboard rather than clicking.
  await legendToggle.focus()
  await page.keyboard.press('Space')
  await expect(demo.getByText('Sessions 51', { exact: true })).toHaveCount(0)
})

test('showcase: the columns Value cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const { demo } = await openChart(page)

  await page.getByRole('button', { name: 'Edit columns' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit columns' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // An unknown tone has no palette class, so the draft is rejected behind an
  // inline error instead of rendering a segment with no fill.
  await replaceSnippet(page, dialog, '[{"label": "Solo", "segments": [{"value": 1, "tone": "pink"}]}]')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid edit applies on OK and drives the axis and legend.
  await replaceSnippet(page, dialog, '[{"label": "Solo", "segments": [{"value": 7, "label": "Pings"}]}]')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.getByText('Pings 7', { exact: true })).toBeVisible()
  await expect(demo.getByText('Mon', { exact: true })).toHaveCount(0)
})

test('showcase: hovering a column shows its tip through the shared Tooltip', async ({ page }) => {
  const { plot } = await openChart(page)
  // The columns are a centred row, so the plot's midpoint lands on the middle
  // (Wed) column, which spans the full plot height.
  await plot.hover()
  await expect(page.getByRole('tooltip')).toContainText('Wed — 6 sessions, 2 retries')
})

test('showcase: a theme switch recolours the chart tones', async ({ page }) => {
  const { demo } = await openChart(page)
  const swatch = demo.getByText('Sessions 51', { exact: true }).locator('i')
  const before = await swatch.evaluate(el => getComputedStyle(el).backgroundColor)
  await page.getByRole('button', { name: 'Theme' }).click()
  // Sepia remaps cyan to amber; the light themes deliberately leave grade-500
  // accents untouched, and the tone fills use grade 500.
  await page.getByRole('menuitemradio', { name: 'Sepia' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia')
  // The tone is a palette utility (`bg-cyan-500/60`), so the theme's remapped
  // `--color-cyan-500` repaints it.
  const after = await swatch.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(after).not.toBe(before)
})
