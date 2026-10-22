import { expect, test } from '@playwright/test'
import { editorContains, normalizeDemoText, replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

// AppShell hosts its code toggle in the title row beside a resizable demo. The
// scalar props edit through the props table's Value column; the class-name
// map and the pane configs edit as JSON through their own Value-cell dialogs
// with an apply eye. The page has no settings panel.
test('showcase: AppShell hosts its code toggle in the title row beside a Value column', async ({ page }) => {
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')

  const toggle = showCodeToggle(page)

  await expect(page.getByRole('heading', { level: 1, name: 'AppShell' })).toBeVisible()
  await expect(toggle).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Props' }).getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const demo = showcaseDemo(page)
  const before = normalizeDemoText(await demo.textContent())
  const handle = await demo.elementHandle()
  await toggle.click()
  await expect(snippetEditor(page)).toBeVisible()
  // Wait until the compile swaps the static demo node for the live instance, so
  // assertions below run after `onCompiled` fired (not merely at open time).
  await expect
    .poll(
      async () =>
        (await snippetError(page).count()) > 0 ||
        (handle ? await handle.evaluate(element => !element.isConnected) : false),
      { timeout: 15000 },
    )
    .toBe(true)
  await expect(snippetError(page)).toHaveCount(0)
  expect(normalizeDemoText(await showcaseDemo(page).textContent())).toBe(before)

  // Opening the editor must not write the emitted default class back into the
  // Value column: the form stays pristine (unset renders the stage default).
  await expect(page.getByRole('textbox', { name: 'className value', exact: true })).toHaveValue('')
})

test('showcase: the AppShell demo opens a floating right drawer', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  await expect(demo.getByText('Components', { exact: true })).toBeVisible()
  const rightPane = () => demo.getByRole('complementary', { name: 'Right pane' })

  // Enabling the right pane docks it beside the demo content (desktop): the
  // right config edits as JSON through its Value-cell dialog.
  const props = page.getByRole('region', { name: 'Props' })
  await props.getByRole('button', { name: 'Edit right', exact: true }).click()
  const rightDialog = page.getByRole('dialog', { name: 'Edit right', exact: true })
  await expect(rightDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "open": true\n}', rightDialog)
  await rightDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(rightPane()).toBeVisible()
  await expect(demo.locator('[data-drawer-presentation="docked"]')).toHaveCount(2)

  // Let the docked pane's slide-in finish so every measurement below is the
  // settled layout, not a mid-transition frame.
  await page.waitForTimeout(400)

  // The right pane is anchored to the row's right edge, so its splitter sits
  // on the pane's left edge and drags the width the opposite way from a left
  // pane. Dragging left must widen the pane (move its left edge left) so the
  // handle stays under the cursor. The dialog close returns focus to its
  // trigger down the page, so scroll the handle back into view first —
  // otherwise the synthetic mouse events land outside the viewport and the
  // drag never starts.
  const rightWrapper = demo.locator('[data-drawer-presentation="docked"]').last()
  const rightHandle = rightWrapper.getByRole('separator')
  await rightHandle.scrollIntoViewIfNeeded()
  await expect(rightHandle).toBeVisible()
  const paneLeft = async () => (await rightPane().boundingBox())!.x
  const beforeLeft = await paneLeft()
  const handleBox = await rightHandle.boundingBox()
  expect(handleBox).not.toBeNull()
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox!.x - 80, handleBox!.y + handleBox!.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(200)
  const widenedLeft = await paneLeft()
  expect(widenedLeft).toBeLessThan(beforeLeft - 40)

  // Arrow keys move the handle the way the key points, not merely the value.
  await rightHandle.focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
  expect(await paneLeft()).toBeGreaterThan(widenedLeft + 5)

  // Home/End jump to the track's ends: for the right pane Home widens it (the
  // handle moves to the row's left edge) and End narrows it, mirroring the
  // pointer instead of running the handle the wrong way.
  await rightHandle.focus()
  const beforeHome = await paneLeft()
  await page.keyboard.press('Home')
  await page.waitForTimeout(200)
  const homeLeft = await paneLeft()
  expect(homeLeft).toBeLessThan(beforeHome - 5)
  await page.keyboard.press('End')
  await page.waitForTimeout(200)
  expect(await paneLeft()).toBeGreaterThan(homeLeft + 5)

  // Pinning floating mode overlays both drawers behind one backdrop.
  await page.getByRole('combobox', { name: 'mode value', exact: true }).click()
  await page.getByRole('option', { name: 'floating', exact: true }).click()
  await expect(demo.getByRole('button', { name: 'Close pane' })).toBeVisible()
  // The docked panes slide out (200ms); wait until they detach so later
  // assertions never catch a mid-transition duplicate.
  await expect(demo.locator('[data-drawer-presentation="docked"]')).toHaveCount(0)

  // Both floating panes paint above the shared backdrop: a point inside a pane
  // resolves into that pane, never into the backdrop layered over it.
  const floatingPanes = demo.locator('[data-drawer-presentation="floating"]')
  await expect(floatingPanes).toHaveCount(2)
  for (const floatingPane of await floatingPanes.all()) {
    const box = await floatingPane.boundingBox()
    expect(box).not.toBeNull()
    const aboveBackdrop = await floatingPane.evaluate(
      (pane, point) => Boolean(pane.contains(document.elementFromPoint(point.x, point.y))),
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    )
    expect(aboveBackdrop, 'floating pane must sit above its backdrop').toBe(true)
  }

  // A pointer press inside the right drawer reaches the drawer, so it stays
  // open; with the backdrop painted on top this click would dismiss it instead.
  const rightBox = await rightPane().boundingBox()
  expect(rightBox).not.toBeNull()
  await page.mouse.click(rightBox!.x + rightBox!.width / 2, rightBox!.y + rightBox!.height / 2)
  await expect(rightPane()).toBeVisible()

  // Escape closes the right drawer first, then the left one.
  await page.keyboard.press('Escape')
  await expect(rightPane()).toBeHidden()
  await expect(demo.getByText('Components', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(demo.getByRole('button', { name: 'Close pane' })).toHaveCount(0)
  await expect(demo.getByText('Components', { exact: true })).toHaveCount(0)
})

test('showcase: the AppShell Value column edits the live demo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // The eye toggle applies the footer snippet, which renders the footer row;
  // toggling it off removes the row again.
  const props = page.getByRole('region', { name: 'Props' })
  await props.getByRole('button', { name: 'Apply footer' }).click()
  await expect(demo.locator('footer')).toBeVisible()
  await props.getByRole('button', { name: 'Unapply footer' }).click()
  await expect(demo.locator('footer')).toHaveCount(0)
  await props.getByRole('button', { name: 'Apply footer' }).click()
  await expect(demo.locator('footer')).toBeVisible()

  // Closing the left pane through its JSON dialog hides the pane.
  // The footer shown above reuses the same "Components" text, so assert on
  // the pane landmark instead of the text.
  await props.getByRole('button', { name: 'Edit left', exact: true }).click()
  const leftDialog = page.getByRole('dialog', { name: 'Edit left', exact: true })
  await expect(leftDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "open": false\n}', leftDialog)
  await leftDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('complementary', { name: 'Left pane' })).toBeHidden()
})

test('showcase: the AppShell content-snippet Value cells edit the demo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // The children block edits through its markup dialog; the left and right
  // pane texts edit through their own markup dialogs.
  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit children' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit children' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '<p class="p-4 text-sm text-slate-300">Main copy</p>', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByText('Main copy', { exact: true })).toBeVisible()

  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit leftPane' }).click()
  const leftDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit leftPane' }) })
  await expect(leftDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(
    page,
    [
      '<span class="flex items-center gap-2 px-3 py-2 text-sm text-slate-300">',
      '  <MenuIcon className="shrink-0" />',
      '  <span class="min-w-0 truncate @max-[8rem]:hidden">Nav</span>',
      '</span>',
    ].join('\n'),
    leftDialog,
  )
  await leftDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByText('Nav', { exact: true })).toBeVisible()

  const props = page.getByRole('region', { name: 'Props' })
  await props.getByRole('button', { name: 'Edit right', exact: true }).click()
  // The dialog node is reused across opens with a stale accessible name, so
  // anchor on its heading like the pane dialogs above.
  const rightOpenDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit right', exact: true }) })
  await expect(rightOpenDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "open": true\n}', rightOpenDialog)
  await rightOpenDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('complementary', { name: 'Right pane' })).toBeVisible()
  await props.getByRole('button', { name: 'Edit rightPane' }).click()
  const rightDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit rightPane' }) })
  await expect(rightDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '<p class="px-3 py-2 text-sm text-slate-300">Aside copy</p>', rightDialog)
  await rightDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByText('Aside copy', { exact: true })).toBeVisible()
})

test('showcase: the AppShell header eye omits and restores the header', async ({ page }) => {
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // The fixed header shape documents itself through the edit dialog.
  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit header' }).click()
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit header' }) })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()

  // Unapplying omits the header snippet, removing the whole header element
  // (not a blank bar); re-applying restores it.
  const headerToggle = () => demo.getByRole('button', { name: 'Hide pane' })
  await expect(headerToggle()).toBeVisible()
  await page.getByRole('button', { name: 'Unapply header', exact: true }).click()
  await expect(headerToggle()).toHaveCount(0)
  await expect(demo.locator('header')).toHaveCount(0)
  await page.getByRole('button', { name: 'Apply header', exact: true }).click()
  await expect(demo.locator('header')).toBeVisible()
  await expect(headerToggle()).toBeVisible()
})

test('showcase: the AppShell rail pane shows a compact rail variant', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)

  // Rail collapse with a closed pane narrows the drawer to the rail strip:
  // the left config edits as JSON through its Value-cell dialog.
  await page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit left', exact: true }).click()
  const leftDialog = page.getByRole('dialog', { name: 'Edit left', exact: true })
  await expect(leftDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "collapseMode": "rail",\n  "open": false\n}', leftDialog)
  await leftDialog.getByRole('button', { name: 'OK', exact: true }).click()

  // The closed rail keeps its strip width instead of shrinking to the content.
  const pane = demo.getByRole('complementary', { name: 'Left pane' })
  await expect(pane).toBeVisible()
  await expect
    .poll(async () => Math.round((await pane.boundingBox())?.width ?? 0), { timeout: 5000 })
    .toBe(64)
  // The rail variant drops the label and keeps the icon, so nothing spills
  // across the splitter; overflow stays as the containment backstop.
  await expect(pane.getByText('Components', { exact: true })).toBeHidden()
  await expect(pane.locator('svg').first()).toBeVisible()
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const aside = document.querySelector('[data-showcase-demo] [aria-label="Left pane"]')
          if (!(aside instanceof HTMLElement)) return null
          return { overflow: getComputedStyle(aside).overflow, fits: aside.scrollWidth <= aside.clientWidth }
        }),
      { timeout: 5000 },
    )
    .toEqual({ overflow: 'hidden', fits: true })
})

// The left JSON dialog round-trips every facet it presents: committing an
// override shows it in the demo and the snippet, while a function entry (which
// rides the demo object internally) rejects the commit instead of applying it.
test('showcase: the AppShell left editor updates the demo and snippet', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const editLeft = page.getByRole('region', { name: 'Props' }).getByRole('button', { name: 'Edit left', exact: true })

  // Dialog -> demo + snippet: a size override lands verbatim in the editor.
  await editLeft.click()
  const dialog = page.getByRole('dialog', { name: 'Edit left', exact: true })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "size": 320\n}', dialog)
  await expect(dialog.locator('.cm-content')).toContainText('320')
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'size: 320')).toBe(true)
  expect(await editorContains(page, 'left={{')).toBe(true)

  // A function entry never survives the JSON editor: OK disables with
  // guidance, and Reset restores the committable draft.
  await editLeft.click()
  await expect(dialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, '{\n  "open": true,\n  "onOpenChange": true\n}', dialog)
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(demo.getByRole('complementary', { name: 'Left pane' })).toBeVisible()
})

// The pane eye toggles apply and unapply the object props without touching
// the committed JSON: unapplying the right config closes the drawer, and
// unapplying the left config drops the prop from the seed while the JSON
// stays intact for re-applying.
test('showcase: the AppShell pane eyes apply and unapply the configs', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const props = page.getByRole('region', { name: 'Props' })

  // Open the right pane through its JSON dialog, then unapply the config.
  await props.getByRole('button', { name: 'Edit right', exact: true }).click()
  const rightDialog = page.getByRole('dialog', { name: 'Edit right', exact: true })
  await expect(rightDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "open": true,\n  "size": 320\n}', rightDialog)
  await rightDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByRole('complementary', { name: 'Right pane' })).toBeVisible()

  await props.getByRole('button', { name: 'Unapply right', exact: true }).click()
  await expect(demo.getByRole('complementary', { name: 'Right pane' })).toBeHidden()
  await props.getByRole('button', { name: 'Apply right', exact: true }).click()
  await expect(demo.getByRole('complementary', { name: 'Right pane' })).toBeVisible()

  // Unapplying the left config drops the prop from the seed while the right
  // config (and its size entry) stays.
  await props.getByRole('button', { name: 'Unapply left', exact: true }).click()
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, 'left={{')).toBe(false)
  expect(await editorContains(page, 'size: 320')).toBe(true)

  // The class-names map edits the same way: committing an override lands it
  // in the demo and the seed, and the eye drops the prop while keeping the
  // JSON for re-applying.
  await props.getByRole('button', { name: 'Edit classNames', exact: true }).click()
  const namesDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit classNames', exact: true }) })
  await expect(namesDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "main": "custom-main"\n}', namesDialog)
  await namesDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.locator('main.custom-main')).toBeVisible()
  expect(await editorContains(page, 'main: "custom-main"')).toBe(true)
  await props.getByRole('button', { name: 'Unapply classNames', exact: true }).click()
  await expect(demo.locator('main.custom-main')).toHaveCount(0)
  await props.getByRole('button', { name: 'Apply classNames', exact: true }).click()
  await expect(demo.locator('main.custom-main')).toBeVisible()
  expect(await editorContains(page, 'main: "custom-main"')).toBe(true)
})

// The left-pane content eye omits the pane while keeping the label text: the
// drawer stays open but renders empty, and re-applying restores the label.
test('showcase: the AppShell leftPane eye omits and restores the pane', async ({ page }) => {
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const props = page.getByRole('region', { name: 'Props' })

  await expect(demo.getByText('Components', { exact: true })).toBeVisible()
  await props.getByRole('button', { name: 'Unapply leftPane' }).click()
  await expect(demo.getByText('Components', { exact: true })).toHaveCount(0)
  await expect(demo.getByRole('complementary', { name: 'Left pane' })).toBeVisible()
  await props.getByRole('button', { name: 'Apply leftPane' }).click()
  await expect(demo.getByText('Components', { exact: true })).toBeVisible()
})

// The right-pane content eye composes with the right config eye: the drawer
// shows only while both apply. Unapplying the content eye empties the open
// drawer; the config eye still owns open/close.
test('showcase: the AppShell rightPane eye empties and restores the drawer', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const props = page.getByRole('region', { name: 'Props' })

  // Open the right drawer through its JSON dialog.
  await props.getByRole('button', { name: 'Edit right', exact: true }).click()
  const rightDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit right', exact: true }) })
  await expect(rightDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{\n  "open": true\n}', rightDialog)
  await rightDialog.getByRole('button', { name: 'OK', exact: true }).click()
  const rightPane = demo.getByRole('complementary', { name: 'Right pane' })
  await expect(rightPane).toBeVisible()
  await expect(rightPane).toContainText('Canonical shared UI primitives')

  // Unapplying the content eye empties the drawer without closing it.
  await props.getByRole('button', { name: 'Unapply rightPane' }).click()
  await expect(rightPane).toBeVisible()
  await expect(rightPane).not.toContainText('Canonical shared UI primitives')
  await props.getByRole('button', { name: 'Apply rightPane' }).click()
  await expect(rightPane).toContainText('Canonical shared UI primitives')
})

// The children/footer snippet dialogs commit only a shape the static demo
// reproduces exactly: valid markup updates the demo and the seed, while an
// unreproducible draft disables OK behind the inline alert.
test('showcase: the AppShell children and footer dialogs round-trip markup', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const demo = showcaseDemo(page)
  const props = page.getByRole('region', { name: 'Props' })

  // Footer: the eye toggle applies the seeded markup; committing edited labels
  // renders the footer with those labels.
  const editFooter = props.getByRole('button', { name: 'Edit footer' })
  const footerMarkup = (nav: string, title: string) =>
    [
      '<div class="flex min-w-0 flex-1 items-center justify-between gap-4">',
      `  <span class="text-xs text-slate-400">${nav}</span>`,
      `  <span class="text-xs text-slate-400">${title}</span>`,
      '</div>',
    ].join('\n')
  await props.getByRole('button', { name: 'Apply footer' }).click()
  const footer = demo.locator('footer')
  await expect(footer).toBeVisible()
  await editFooter.click()
  const footerDialog = page.getByRole('dialog', { name: 'Edit footer' })
  await expect(footerDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, footerMarkup('Nav X', 'Title Y'), footerDialog)
  await footerDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(footer.getByText('Nav X', { exact: true })).toBeVisible()
  await expect(footer.getByText('Title Y', { exact: true })).toBeVisible()

  // The canonical row plus trailing markup is unreproducible: OK disables and
  // the alert shows; Reset restores the seed, and the dialog detaches on Close.
  await editFooter.click()
  await expect(footerDialog.locator('.cm-content')).toBeVisible()
  await replaceSnippet(page, `${footerMarkup('Nav X', 'Title Y')}\n<div>EXTRA</div>`, footerDialog)
  await expect(footerDialog.getByRole('alert')).toBeVisible()
  await expect(footerDialog.getByRole('button', { name: 'OK', exact: true })).toBeDisabled()
  await footerDialog.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(footerDialog.getByRole('button', { name: 'OK', exact: true })).toBeEnabled()
  await footerDialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(footerDialog).toHaveCount(0)

  // Children: free-form HTML commits verbatim, while an unreproducible draft (an
  // unclosed tag) disables OK behind the alert.
  await props.getByRole('button', { name: 'Edit children' }).click()
  const childrenDialog = page.getByRole('dialog')
  await expect(childrenDialog.getByRole('heading', { name: 'Edit children' })).toBeVisible()
  await expect(childrenDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '<div><p>Nope</p>', childrenDialog)
  await expect(childrenDialog.getByRole('alert')).toBeVisible()
  await expect(childrenDialog.getByRole('button', { name: 'OK', exact: true })).toBeDisabled()
  await replaceSnippet(page, '<div class="grid gap-2"><p class="p-4 text-sm text-slate-300">Round trip</p><p class="p-4 text-sm text-slate-300">Second copy</p></div>', childrenDialog)
  await expect(childrenDialog.getByRole('alert')).toHaveCount(0)
  await childrenDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo.getByText('Round trip', { exact: true })).toBeVisible()
  await expect(demo.getByText('Second copy', { exact: true })).toBeVisible()

  // The committed footer labels land in the Show-code seed.
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, '{#snippet footer()}')).toBe(true)
  expect(await editorContains(page, 'Nav X')).toBe(true)
  expect(await editorContains(page, 'Title Y')).toBe(true)
  // The committed children markup lands in the Show-code seed too.
  expect(await editorContains(page, 'Second copy')).toBe(true)
})

// The className row is a long text value, so it edits through a textarea
// beside its apply eye: the area stretches to the row height instead of
// leaving a gap, and the eye stays inside the Value cell.
test('showcase: the AppShell className area fills its Value cell', async ({ page }) => {
  await page.goto('/components/app-shell')
  await page.waitForLoadState('networkidle')
  const props = page.getByRole('region', { name: 'Props' })
  const area = props.getByRole('textbox', { name: 'className value', exact: true })
  await expect(area).toBeVisible()

  const geom = await area.evaluate(el => {
    const td = el.closest('td')!
    const box = el.getBoundingClientRect()
    const cell = td.getBoundingClientRect()
    return {
      top: Math.round(box.top - cell.top),
      bottom: Math.round(cell.bottom - box.bottom),
      right: Math.round(cell.right - box.right),
    }
  })
  // The area spans the padded cell: 8px off the top and bottom edges.
  expect(geom.top).toBe(8)
  expect(geom.bottom).toBeGreaterThanOrEqual(7)
  expect(geom.bottom).toBeLessThanOrEqual(9)

  // Its right edge clears the eye zone (cell padding + row gap + eye width).
  const eye = props.getByRole('button', { name: 'Apply className', exact: true })
  const eyeWidth = Math.round((await eye.boundingBox())!.width)
  expect(geom.right).toBe(eyeWidth + 8 + 12)

  // The eye sits inside the Value cell instead of spilling into Notes.
  const contained = await eye.evaluate(el => {
    const td = el.closest('td')!
    const box = el.getBoundingClientRect()
    return box.right <= td.getBoundingClientRect().right + 1
  })
  expect(contained).toBe(true)
})
