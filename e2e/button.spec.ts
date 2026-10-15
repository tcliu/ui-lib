import { expect, test } from '@playwright/test'
import { replaceSnippet } from './helpers'

test('showcase: the Button icon cell applies the bare glyph through the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  // The dialog only accepts the bare glyph (Button sizes it from its own
  // size), but the eye stays off, so the demo is unchanged.
  await page.getByRole('button', { name: 'Edit icon' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit icon' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  await replaceSnippet(page, dialog, '<CheckIcon />')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo.locator('svg')).toHaveCount(0)

  // Applying the eye renders the leading icon.
  await page.getByRole('button', { name: 'Apply icon' }).click()
  await expect(demo.locator('svg')).toHaveCount(1)

  // Unapplying removes it again.
  await page.getByRole('button', { name: 'Unapply icon' }).click()
  await expect(demo.locator('svg')).toHaveCount(0)
})

test('showcase: the Button accent eye stages the tint in Show-code', async ({ page }) => {
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')

  // Selecting a tint applies the eye; the seed carries the accent line.
  await page.getByRole('combobox', { name: 'accent value', exact: true }).click()
  await page.getByRole('option', { name: 'emerald', exact: true }).click()
  await page.getByRole('button', { name: 'Show code' }).click()
  const editor = page.locator('main .cm-content').first()
  await expect(editor).toBeVisible({ timeout: 15000 })
  await expect(editor).toContainText('accent="emerald"')

  // Unapplying drops the line while the Value keeps the selection.
  await page.getByRole('button', { name: 'Unapply accent' }).click()
  await expect(editor).not.toContainText('accent=')

  // Re-applying restores it.
  await page.getByRole('button', { name: 'Apply accent' }).click()
  await expect(editor).toContainText('accent="emerald"')
  await page.getByRole('button', { name: 'Hide code' }).click()
})

test('showcase: the Button disabled eye stages the flag in Show-code', async ({ page }) => {
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')

  // Checking the box applies the eye; the seed carries the bare flag. The
  // input is screen-reader-only under its label, so force the check.
  await page.getByRole('checkbox', { name: 'disabled value', exact: true }).check({ force: true })
  await page.getByRole('button', { name: 'Show code' }).click()
  const editor = page.locator('main .cm-content').first()
  await expect(editor).toBeVisible({ timeout: 15000 })
  await expect(editor).toContainText('disabled')

  // Unapplying drops the flag.
  await page.getByRole('button', { name: 'Unapply disabled' }).click()
  await expect(editor).not.toContainText('disabled')

  // Re-applying restores it.
  await page.getByRole('button', { name: 'Apply disabled' }).click()
  await expect(editor).toContainText('disabled')
  await page.getByRole('button', { name: 'Hide code' }).click()
})

test('showcase: an icon-only Button matches the text row height in every variant', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')

  // Text-only, icon + label, and icon-only in one row per variant. Bordered
  // variants fill the row with padding; the paddingless ghost relies on the
  // icon-only box flooring at the text line height, so ghost is the case that
  // regresses if that floor is dropped.
  const rows = ['primary', 'secondary', 'ghost'].flatMap(variant =>
    [16, 20].flatMap(size => [
      `  <div data-v="${variant}-${size}" class="flex items-center gap-3">`,
      `    <Button variant="${variant}" size={${size}}>Label</Button>`,
      `    <Button variant="${variant}" size={${size}}>`,
      '      Label',
      '      {#snippet icon()}',
      '        <CheckIcon />',
      '      {/snippet}',
      '    </Button>',
      `    <Button variant="${variant}" size={${size}} ariaLabel="icon">`,
      '      {#snippet icon()}',
      '        <CheckIcon />',
      '      {/snippet}',
      '    </Button>',
      '  </div>',
    ]),
  )
  const snippet = ['<div class="flex flex-col items-start gap-3">', ...rows, '</div>'].join('\n')

  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, page.locator('main'), snippet)
  await expect(page.locator('[data-showcase-demo] [data-v]')).toHaveCount(6)

  const measured = await page.locator('[data-showcase-demo] [data-v]').evaluateAll(nodes =>
    nodes.map(row => ({
      variant: row.getAttribute('data-v'),
      heights: [...row.querySelectorAll('button')].map(button => button.getBoundingClientRect().height),
    })),
  )
  for (const { variant, heights } of measured) {
    expect(heights, `${variant} renders three compositions`).toHaveLength(3)
    // All three compositions share one row height; only sub-pixel rounding may differ.
    for (const height of heights) expect(Math.abs(height - heights[0]!), `${variant} height ${height}`).toBeLessThan(0.5)
  }
})

test('showcase: the children eye off renders a true icon-only Button', async ({ page }) => {
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const button = demo.locator('button').first()
  const labeled = (await button.boundingBox())!

  await page.getByRole('button', { name: 'Apply icon' }).click()
  await page.getByRole('button', { name: 'Unapply children' }).click()

  // Children off omits the snippet, so the button takes the icon-only square
  // shape instead of a padded label row, and keeps the labeled row height.
  await expect
    .poll(async () => {
      const box = (await button.boundingBox())!
      return Math.abs(box.width - box.height) < 0.5
    })
    .toBe(true)
  expect(Math.abs((await button.boundingBox())!.height - labeled.height)).toBeLessThan(0.5)
})
