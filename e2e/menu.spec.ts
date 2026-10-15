import { expect, test } from '@playwright/test'
import { editorContains, replaceSnippet } from './helpers'

// Menu follows the converted showcase layout: the code toggle sits beside the
// component title, the demo sits in a borderless resizable frame, and the
// props table appends an editable Value column.
test('showcase: Menu hosts its code toggle in the title row beside a resizable demo', async ({ page }) => {
  await page.goto('/components/menu')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button', { name: 'Show code' })

  await expect(page.getByRole('heading', { level: 1, name: 'Menu' })).toBeVisible()
  await expect(toggle).toHaveCount(1)

  // The demo sits in a resizable frame. Resizable renders its width, height,
  // and corner handles unconditionally.
  await expect(demo.locator('[role="separator"]')).toHaveCount(3)

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the stage snippet, which reproduces the demo.
  const before = (await demo.innerText()).replace(/\s+/g, ' ').trim()
  await toggle.click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).toBe(before)
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})

test('showcase: the Menu icon and item cells edit through dialogs with a reset eye', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  // Required snippets carry a reset eye beside the edit icon.
  await expect(page.getByRole('button', { name: 'Unapply icon' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unapply item', exact: true })).toBeVisible()

  // Anything but the canonical icon line blocks OK behind an error.
  await page.getByRole('button', { name: 'Edit icon' }).click()
  const iconDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit icon' }) })
  await expect(iconDialog).toBeVisible()
  await expect(iconDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const iconOk = iconDialog.getByRole('button', { name: 'OK', exact: true })
  await replaceSnippet(page, iconDialog, 'nope')
  await expect(iconDialog.getByRole('alert')).toBeVisible()
  await expect(iconOk).toBeDisabled()

  // A valid class applies on OK and the trigger glyph follows it.
  await replaceSnippet(page, iconDialog, '<KebabIcon className="h-6 w-6" />')
  await expect(iconDialog.getByRole('alert')).toHaveCount(0)
  await iconOk.click()
  await expect(iconDialog).toHaveCount(0)
  await expect(demo.getByRole('button', { name: 'More actions' }).locator('svg')).toHaveClass(/h-6/)

  // The item dialog edits prefix text; unapplying the eye resets the prefix.
  await page.getByRole('button', { name: 'Edit item', exact: true }).click()
  const itemDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit item', exact: true }) })
  await expect(itemDialog).toBeVisible()
  await expect(itemDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, itemDialog, '#')
  await itemDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(itemDialog).toHaveCount(0)
  await demo.getByRole('button', { name: 'More actions' }).click()
  // The open panel portals to document.body, so anchor on the page.
  await expect(page.getByRole('menuitem', { name: '#Edit' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Unapply item', exact: true }).click()
  await demo.getByRole('button', { name: 'More actions' }).click()
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('showcase: the Menu items cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  await page.getByRole('button', { name: 'Edit items', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit items', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeVisible()

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A missing label is not a well-shaped entry, so OK stays blocked.
  await replaceSnippet(page, dialog, '[{"id": "rename"}]')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid list applies on OK; the demo menu follows every facet.
  await replaceSnippet(
    page,
    dialog,
    '[{"id": "rename", "label": "Rename"}, {"id": "remove", "label": "Remove", "disabled": true}]',
  )
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)

  await demo.getByRole('button', { name: 'More actions' }).click()
  // The open panel portals to document.body, so anchor on the page.
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Remove' })).toBeDisabled()
})

test('showcase: Menu snippet items edits flow back into playground state', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()
  const toggle = page.locator('main header').getByRole('button', { name: 'Show code' })
  await toggle.click()
  const editor = page.locator('main .cm-content').first()
  await expect(editor).toBeVisible()
  // Wait out the initial compile so the live instance is mounted.
  await expect.poll(async () => (await demo.innerText()).replace(/\s+/g, ' ').trim(), { timeout: 15000 }).not.toBe('')

  // Editing the script-local items writes them back into playground state, so
  // closing Show code keeps the edited entries in the static demo.
  await replaceSnippet(
    page,
    page.locator('main'),
    [
      '<script>',
      '  let stageWidth = $state(560)',
      '  let items = $state([',
      '    {"id": "rename", "label": "Snippet Rename"},',
      '    {"id": "remove", "label": "Snippet Remove"}',
      '  ]);',
      '</script>',
      '<div class="w-full overflow-hidden">',
      '  <Menu',
      '    items={items}',
      '    itemKey={item => item.id}',
      '    onSelect={index => (lastAction = items[index].label)}',
      '    ariaLabel={triggerLabel}',
      '    itemClass={menuItemClass}',
      '    itemLabel={item => item.label}',
      '    itemDisabled={item => item.disabled ?? false}>',
      '    {#snippet icon()}',
      '      <KebabIcon />',
      '    {/snippet}',
      '    {#snippet item(item)}',
      '      {item.label}',
      '    {/snippet}',
      '  </Menu>',
      '</div>',
    ].join('\n'),
  )
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)

  // The live instance compiles the edited entries; sync then writes them back
  // into playground state, so closing Show code keeps them in the static demo.
  // Poll by opening the menu: the live swap lands after the debounce, so the
  // first opens may still show the seed entries. The trigger sits under the
  // stage's bottom resize handle, so open it from the keyboard (pointer clicks
  // hit the overlay).
  await expect
    .poll(
      async () => {
        await demo.getByRole('button', { name: 'More actions' }).focus()
        await page.keyboard.press('Enter')
        const count = await page.getByRole('menuitem', { name: 'Snippet Rename' }).count()
        await page.keyboard.press('Escape')
        return count
      },
      { timeout: 15000 },
    )
    .toBe(1)
  const hideToggle = page.locator('main header').getByRole('button', { name: 'Hide code' })
  await hideToggle.click()
  await expect(page.locator('main .cm-content')).toHaveCount(0)

  await demo.getByRole('button', { name: 'More actions' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Snippet Rename' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Snippet Remove' })).toBeVisible()
})

test('showcase: the Menu triggerTooltip editor wraps the trigger', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  await page.getByRole('button', { name: 'Edit triggerTooltip' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit triggerTooltip' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, dialog, 'nope')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // An unknown align cannot round-trip, so OK stays blocked.
  await replaceSnippet(page, dialog, '{"text": "Tip-123", "align": "banana"}')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid tooltip applies on OK; focusing the trigger reveals it.
  await replaceSnippet(page, dialog, '{"text": "Tip-123", "align": "left"}')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await demo.getByRole('button', { name: 'More actions' }).focus()
  await expect(page.getByText('Tip-123')).toBeVisible()

  // The regenerated snippet carries the object literal.
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  expect(await editorContains(page, page.locator('main'), 'triggerTooltip={{ text: "Tip-123", align: "left" }}')).toBe(
    true,
  )
})

test('showcase: the Menu triggerTooltip eye omits and the items eye resets', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/menu')
  await page.waitForLoadState('networkidle')

  const demo = page.locator('[data-showcase-demo]').first()

  // Commit a trigger tooltip through the dialog.
  await page.getByRole('button', { name: 'Edit triggerTooltip' }).click()
  const tooltipDialog = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Edit triggerTooltip' }) })
  await expect(tooltipDialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, tooltipDialog, '{\n  "text": "Row actions"\n}')
  await tooltipDialog.getByRole('button', { name: 'OK', exact: true }).click()
  await demo.getByRole('button', { name: 'More actions' }).hover()
  await expect(page.getByText('Row actions')).toBeVisible()

  // Unapplying omits the object; the tooltip no longer shows.
  await page.getByRole('button', { name: 'Unapply triggerTooltip' }).click()
  await demo.getByRole('button', { name: 'More actions' }).hover()
  await expect(page.getByText('Row actions')).toHaveCount(0)

  // The items eye resets to the seed entries instead of omitting.
  await page.getByRole('button', { name: 'Unapply items', exact: true }).click()
  await demo.getByRole('button', { name: 'More actions' }).click()
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible()
  await page.keyboard.press('Escape')
})
