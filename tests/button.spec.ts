import { expect, test } from '@playwright/test'
import {
  editorContains,
  headerReset,
  normalizeDemoText,
  replaceSnippet,
  showCodeToggle,
  showcaseBlock,
  showcaseDemo,
  showcaseProps,
  showcaseTitlebar,
  snippetEditor,
} from './helpers'

test('showcase: the Button icon cell applies the bare glyph through the eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // The dialog only accepts the bare glyph (Button sizes it from its own
  // size), but the eye stays off, so the demo is unchanged.
  await page.getByRole('button', { name: 'Edit icon' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit icon' }) })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  await replaceSnippet(page, '<CheckIcon />', dialog)
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
  const editor = snippetEditor(page)
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
  const editor = snippetEditor(page)
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

  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, snippet)
  await expect(showcaseDemo(page).locator('[data-v]')).toHaveCount(6)

  const measured = await showcaseDemo(page).locator('[data-v]').evaluateAll(nodes =>
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
  const demo = showcaseDemo(page)
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

// The Button children editor (an html code dialog) and the snippet's leading
// script-local label are two views of one value, so editing either updates
// the other.
test('showcase: the Button children editor and the snippet label stay in sync', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  // Hydration binds the toggle, dialog, and compile handlers; wait to interact.
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const editChildren = showcaseProps(page).getByRole('button', { name: 'Edit children' })

  // Dialog -> demo + snippet: a custom label shows on the button and seeds a
  // script-local into the editor.
  await editChildren.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, 'Ship it', dialog)
  await expect(dialog.locator('.cm-content')).toContainText('Ship it')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ship it (0)' })).toBeVisible()
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'let label = $state("Ship it")')).toBe(true)

  // Snippet -> dialog + demo: editing the script-local updates the demo, and
  // reopening the dialog seeds from the new label.
  await replaceSnippet(
    page,
    [
      '<script>',
      '  let label = $state("Deploy")',
      '</script>',
      '<Button variant="primary">{label} ({clicks})</Button>',
    ].join('\n'),
  )
  await expect(page.getByRole('button', { name: 'Deploy (0)' })).toBeVisible({ timeout: 10000 })
  expect(normalizeDemoText(await demo.textContent())).toBe('Deploy (0)')
  await editChildren.click()
  await expect(page.getByRole('dialog').locator('.cm-content')).toContainText('Deploy')
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
})

// The header Reset (after the code toggle) restores every playground field to
// unset, and the demo and editor stay pinned while the props table scrolls.
test('showcase: the header Reset clears the Button playground', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const reset = headerReset(page)

  // The title row, demo, and editor scroll with the page while the props
  // table keeps its own scrollport below.
  await expect(showcaseBlock(page)).toHaveCSS('position', 'static')
  const demo = showcaseDemo(page)

  await showcaseProps(page).getByRole('button', { name: 'Edit children' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, 'Ship it', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ship it (0)' })).toBeVisible()
  await reset.click()
  await expect(page.getByRole('button', { name: 'Apply (0)' })).toBeVisible()

  // At rest the block sits flush at the scroller top with the title one pt-3
  // below it — the page container's 12px top rhythm.
  const scroller = page.getByRole('main')
  const block = showcaseBlock(page)
  const titlebar = showcaseTitlebar(page)
  await scroller.evaluate(el => el.scrollTo(0, 0))
  const mainBox = await scroller.boundingBox()
  await expect.poll(async () => (await block.boundingBox())?.y).toBeCloseTo(mainBox?.y ?? 0, 0)
  await expect
    .poll(async () => (await titlebar.boundingBox())?.y)
    .toBeCloseTo((mainBox?.y ?? 0) + 12, 0)

  // The body scrolls inside its own scrollport while the fixed header band
  // stays put: only tbody rows move. Scoped to the region holding the body —
  // closed dialogs leave mounted tabindex regions behind, so a bare
  // tabindex selector would match those too.
  const propsBody = showcaseProps(page).locator('div[tabindex="-1"]:has(tbody)')
  await propsBody.evaluate(el => el.scrollTo(0, el.scrollHeight))
  await expect.poll(async () => propsBody.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  const thead = showcaseProps(page).getByRole('columnheader').first()
  const headY = (await thead.boundingBox())?.y ?? 0
  await expect.poll(async () => (await thead.boundingBox())?.y).toBeCloseTo(headY, 0)
  // Fill mode: the box takes the viewport remainder, so the page itself
  // never scrolls — no browser scrollbar.
  await scroller.evaluate(el => el.scrollTo(0, el.scrollHeight))
  expect(await scroller.evaluate(el => el.scrollTop)).toBe(0)
  expect(await scroller.evaluate(el => el.scrollHeight)).toBeLessThanOrEqual(
    (await scroller.evaluate(el => el.clientHeight)) + 1,
  )
})

// The size row round-trips named and numeric shapes between the Value column
// and the snippet.
test('showcase: the Button size Value and snippet stay in sync', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/button')
  await page.waitForLoadState('networkidle')
  const sizeValue = page.getByRole('combobox', { name: 'size value' })
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()

  // Snippet -> Value: a named size and a numeric size both surface.
  await replaceSnippet(page, '<Button size="lg">{label} ({clicks})</Button>')
  await expect(sizeValue).toHaveValue('lg', { timeout: 10000 })
  await replaceSnippet(page, '<Button size={24}>{label} ({clicks})</Button>')
  await expect(sizeValue).toHaveValue('24', { timeout: 10000 })

  // Value -> snippet: picking a named size emits the canonical line. Clear
  // first so the panel opens pristine instead of filtered by the old value;
  // ArrowDown opens the focused control without toggling.
  await page.getByRole('button', { name: 'Clear size' }).click()
  await sizeValue.press('ArrowDown')
  await page.getByRole('option', { name: 'sm' }).click()
  expect(await editorContains(page, 'size="sm"')).toBe(true)
})

