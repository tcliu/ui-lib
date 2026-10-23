import { expect, test } from '@playwright/test'
import {
  hideCodeToggle,
  normalizeDemoText,
  replaceSnippet,
  showCodeToggle,
  showcaseDemo,
  showcaseTitlebar,
  snippetEditor,
  snippetError,
  snippetRegion,
} from './helpers'

test('showcase: index redirects to the two-pane component browser', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/components\/base-dialog$/)
  await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'BaseDialog' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SelectDropdown' })).toBeVisible()
})

test('showcase: the left-pane search filters the component list', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration binds the search input; wait for it before interacting.
  await page.waitForLoadState('networkidle')
  await page.getByRole('searchbox', { name: 'Search components' }).fill('spin')
  await expect(page.getByRole('link', { name: 'Spinner' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'BaseDialog' })).toHaveCount(0)
})

test('showcase: the theme icon menu changes the document theme', async ({ page }) => {
  await page.goto('/components/base-dialog')
  // Hydration attaches the menu trigger handler; wait for it before clicking.
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Theme' }).click()
  await page.getByRole('menuitemradio', { name: 'Light' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('showcase: a deep link selects its component in the picker', async ({ page }) => {
  await page.goto('/components/tabs')
  await expect(page.getByRole('heading', { level: 2, name: 'Tabs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tabs' })).toHaveAttribute('aria-current', 'page')
})

test('showcase: an unknown slug renders the localized not-found state', async ({ page }) => {
  await page.goto('/components/nope')
  await expect(page.getByRole('heading', { level: 2, name: 'Component not found' })).toBeVisible()
})

test('showcase: a component page links to related components as chips', async ({ page }) => {
  await page.goto('/components/select-dropdown')
  const related = page.getByRole('navigation', { name: 'Related' })
  await expect(related).toBeVisible()
  await expect(related.getByRole('link', { name: 'ChipDropdown' })).toBeVisible()
  await expect(related.getByRole('link', { name: 'SelectDropdown' })).toHaveCount(0)
  await related.getByRole('link', { name: 'Menu' }).click()
  await expect(page).toHaveURL(/\/components\/menu$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Menu' })).toBeVisible()
})

test('showcase: the reset button restores a snippet demo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, reset, and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const before = normalizeDemoText(await demo.textContent())
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()

  // Editing the snippet recompiles it and updates the section demo in place.
  await replaceSnippet(page, '<Button variant="primary">Live demo</Button>')
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 })

  // Reset restores the seed source, and the normal debounce/compile pipeline
  // recompiles it back to the initial demo. The header hosts its own Reset
  // beside the toggle, so scope to the editor's draft-reset inside the code
  // region.
  await snippetRegion(page).getByRole('button', { name: 'Reset', exact: true }).click()
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
  const demo = showcaseDemo(page)
  // The static demo paints before any compilation runs.
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
  await showCodeToggle(page).click()

  // The editor opens below the demo row.
  await expect(snippetEditor(page)).toBeVisible()

  // Editing the snippet recompiles it and updates the section demo in place.
  await replaceSnippet(page, '<Button variant="primary">Live demo</Button>')
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toHaveCount(0)

  // The copy button still copies the edited source.
  await page.getByRole('button', { name: 'Copy code' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied')
  await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '<Button variant="primary">Live demo</Button>',
  )

  // Invalid source shows an inline error and keeps the current demo on screen.
  await replaceSnippet(page, '<Button variant="primary">Broken')
  await expect(snippetError(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Live demo' })).toBeVisible()

  // Closing the toggle restores the static demo and clears the error.
  await hideCodeToggle(page).click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
  await expect(snippetError(page)).toHaveCount(0)
  await expect(snippetEditor(page)).toHaveCount(0)
  expect(normalizeDemoText(await demo.textContent())).toBe('Apply (0)')
})

// The title-row eye toggle hides the demo in place (kept mounted, so grid
// state and any live instance survive) and restores it; the code editor and
// the props table are unaffected.
test('showcase: the header demo toggle hides and restores the demo', async ({ page }) => {
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const titlebar = showcaseTitlebar(page)
  await expect(demo).toBeVisible()

  await titlebar.getByRole('button', { name: 'Hide demo' }).click()
  await expect(demo).toBeHidden()
  await expect(titlebar.getByRole('button', { name: 'Show demo' })).toBeVisible()

  await titlebar.getByRole('button', { name: 'Show demo' }).click()
  await expect(demo).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()
})
