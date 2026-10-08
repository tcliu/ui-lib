import { expect, test } from '@playwright/test'
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components'
import { normalizeDemoText, replaceSnippet } from './helpers'

// A section's snippet must reproduce its own static demo: with default state,
// opening the Show-code toggle compiles clean (no alert) and leaves the demo
// row's text unchanged until the user edits.
for (const { slug, name } of SHOWCASE_COMPONENTS) {
  test(`showcase: ${name} snippets reproduce their static demos`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    // Hydration binds the toggle and compile handlers; wait before interacting.
    await page.waitForLoadState('networkidle')
    // Direct children only: the props table section has no toggle and the
    // editor's own section nests inside its demo section once opened.
    const sections = page.locator('main > div > section')
    await expect(await sections.count()).toBeGreaterThan(0)
    for (let index = 0; index < (await sections.count()); index += 1) {
      const section = sections.nth(index)
      const toggle = section.getByRole('button', { name: 'Show code' })
      if ((await toggle.count()) === 0) continue
      const demo = section.locator(':scope > div:nth-child(2)')
      const before = normalizeDemoText(await demo.textContent())
      const handle = await demo.elementHandle()
      await toggle.click()
      await expect(section.locator('.cm-content')).toBeVisible()
      // A clean compile swaps the static demo row for the live instance;
      // a failed compile keeps the row and shows an inline error instead.
      await expect
        .poll(
          async () =>
            (await section.getByRole('alert').count()) > 0 ||
            (handle ? await handle.evaluate(element => !element.isConnected) : false),
          { timeout: 15000 },
        )
        .toBe(true)
      await expect(section.getByRole('alert')).toHaveCount(0)
      expect(normalizeDemoText(await demo.textContent())).toBe(before)
      await section.getByRole('button', { name: 'Hide code' }).click()
      await expect(section.locator('.cm-content')).toHaveCount(0)
    }
  })
}

// Button is a converted showcase page: the code toggle lives in the shared
// `ShowcasePage` header (beside the title) and the props table carries a Value
// column, so these specs anchor on the header toggle and the demo hook rather
// than the per-section toggle the loop above uses.
test('showcase: Button hosts its code toggle in the title row beside a Value column', async ({ page }) => {
  await page.goto('/components/button')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button')

  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the snippet, which reproduces the demo.
  const before = normalizeDemoText(await demo.textContent())
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => normalizeDemoText(await demo.textContent()), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the reset button restores a snippet demo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, reset, and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  const before = normalizeDemoText(await demo.textContent())
  await page.locator('main header button').click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()

  // Editing the snippet recompiles it and updates the section demo in place.
  await replaceSnippet(page, page.locator('main'), '<Button variant="primary">Live demo</Button>')
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 })

  // Reset restores the seed source, and the normal debounce/compile pipeline
  // recompiles it back to the initial demo. The page's settings panel has its
  // own Reset, so scope to the editor's draft-reset inside the code region.
  const codeRegion = page.getByRole('region', { name: 'Code' })
  await codeRegion.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible({
    timeout: 10000,
  })
  await expect(page.getByRole('button', { name: 'Live demo' })).toHaveCount(0)
  expect(normalizeDemoText(await demo.textContent())).toBe(before)
})

test('showcase: a code snippet edits its section demo in place', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, copy, and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')
  const demo = page.locator('[data-showcase-demo]').first()
  // The static demo paints before any compilation runs.
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
  await page.locator('main header button').click()

  // The editor opens below the demo row.
  await expect(page.locator('main .cm-content').first()).toBeVisible()

  // Editing the snippet recompiles it and updates the section demo in place.
  await replaceSnippet(page, page.locator('main'), '<Button variant="primary">Live demo</Button>')
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toHaveCount(0)

  // The copy button still copies the edited source.
  await page.getByRole('button', { name: 'Copy code' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied')
  await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '<Button variant="primary">Live demo</Button>',
  )

  // Invalid source shows an inline error and keeps the current demo on screen.
  await replaceSnippet(page, page.locator('main'), '<Button variant="primary">Broken')
  await expect(page.locator('main').getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible()

  // Closing the toggle restores the static demo and clears the error.
  await page.locator('main header button').click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
  await expect(page.locator('main .cm-content')).toHaveCount(0)
  expect(normalizeDemoText(await demo.textContent())).toBe('Apply (0)')
})
