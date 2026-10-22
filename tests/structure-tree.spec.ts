import { expect, test } from '@playwright/test'
import { editorContains, normalizeDemoText, replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

// StructureTree follows the converted showcase layout: the code toggle sits
// beside the component title and the props table appends an editable Value
// column. The demo tree starts from the default nodes with editing wired.
test('showcase: StructureTree hosts its code toggle in the title row beside a Value column', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  // Hydration binds the toggle and compile handlers; wait before interacting.
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  const toggle = showCodeToggle(page)

  await expect(page.getByRole('heading', { level: 1, name: 'StructureTree' })).toBeVisible()
  await expect(toggle).toHaveCount(1)
  await expect(demo).toContainText('Ada Lovelace')

  // The props table appends a Value column.
  await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible()

  // Opening Show code compiles the snippet, which reproduces the demo.
  const before = normalizeDemoText(await demo.textContent())
  await toggle.click()
  await expect(snippetEditor(page)).toBeVisible()
  await expect.poll(async () => normalizeDemoText(await demo.textContent()), { timeout: 15000 }).toBe(before)
  await expect(snippetError(page)).toHaveCount(0)
})

test('showcase: the StructureTree value cell edits JSON through a dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Ada Lovelace')

  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })

  // Invalid JSON blocks OK behind an inline error.
  await replaceSnippet(page, 'nope', dialog)
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(ok).toBeDisabled()

  // A valid document applies on OK and the demo follows it.
  await replaceSnippet(page, '{"ship": "it"}', dialog)
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await ok.click()
  await expect(dialog).toHaveCount(0)
  await expect(demo).toContainText('ship')
  await expect(demo).not.toContainText('Ada Lovelace')

  // The Show-code seed regenerates from the committed value.
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  expect(await editorContains(page, '"ship":"it"')).toBe(true)
})

test('showcase: editing a StructureTree leaf updates the demo in place', async ({ page }) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Ada Lovelace')

  await demo.getByRole('button', { name: 'Edit $.role' }).click()
  const input = demo.getByRole('textbox').first()
  await expect(input).toBeVisible()
  await input.fill('Captain')
  await input.press('Enter')
  await expect(demo).toContainText('"Captain"')
  await expect(demo).not.toContainText('Engineer')
})

test('showcase: the StructureTree value eye resets to the default tree', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)

  // Commit a custom document through the dialog.
  await page.getByRole('button', { name: 'Edit value' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit value' })
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })
  await replaceSnippet(page, '{"ship": "it"}', dialog)
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(demo).toContainText('ship')
  await expect(demo).not.toContainText('Ada Lovelace')

  // Unapplying resets to the default tree.
  await page.getByRole('button', { name: 'Unapply value' }).click()
  await expect(demo).toContainText('Ada Lovelace')
})

test('showcase: editing a nested object through its edit dialog formats and saves', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Ada Lovelace')

  // Container headers carry a hover edit button, including the root.
  await expect(demo.getByRole('button', { name: 'Edit $.address' })).toHaveCount(1)
  await expect(demo.getByRole('button', { name: 'Edit $', exact: true })).toHaveCount(1)

  await demo.getByRole('button', { name: 'Edit $.address' }).click()
  const dialog = page.getByRole('dialog', { name: '$.address' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.cm-content')).toBeVisible({ timeout: 15000 })

  // Compact JSON formats to two-space indent on Format.
  await replaceSnippet(page, '{"city":"Paris"}', dialog)
  await dialog.getByRole('button', { name: 'Format' }).click()
  expect(await editorContains(page, '"city": "Paris"', dialog)).toBe(true)

  // OK commits the parsed object to the node path. The node stays collapsed
  // as object{1}, so expand it to see the saved value.
  await dialog.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await demo.getByRole('button', { name: 'Expand address' }).click()
  await expect(demo).toContainText('Paris')
  await expect(demo).not.toContainText('London')
})

test('showcase: renaming a nested object key through double-click', async ({ page }) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('Ada Lovelace')

  await demo.getByRole('button', { name: 'address', exact: true }).dblclick()
  const input = demo.getByRole('textbox').first()
  await expect(input).toBeVisible()
  await input.fill('location')
  await input.press('Enter')
  await expect(demo).toContainText('location')
  await expect(demo).not.toContainText('address')
})

test('showcase: the StructureTree row class eyes apply and unapply without losing text', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  // The applied override class is the demo's own marker: anchor on it instead
  // of a DOM-nesting chain, and prove it is absent first so the later counts
  // cannot pass vacuously.
  const customized = demo.locator('.gap-9')
  await expect(customized).toHaveCount(0)

  // Typing a customization applies it live.
  await page
    .getByRole('textbox', { name: 'containerRowClass value', exact: true })
    .fill('gap-9 rounded py-1 hover:bg-slate-800/40')
  await expect(customized.first()).toBeVisible()

  // Unapplying drops it from the demo while the committed text stays.
  await page.getByRole('button', { name: 'Unapply containerRowClass' }).click()
  await expect(customized).toHaveCount(0)

  // Re-applying restores it without retyping.
  await page.getByRole('button', { name: 'Apply containerRowClass' }).click()
  await expect(customized.first()).toBeVisible()
})

test('showcase: editing a StructureTree key or value never moves the row text', async ({ page }) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('"Engineer"')

  // The name-edit row keeps the value as a span, the value-edit row swaps it for
  // the input, so the anchor is whichever exists; positions are read from the
  // row's own children and compared across the three states.
  const geometry = () =>
    demo.evaluate(el => {
      const anchor =
        [...el.querySelectorAll('span')].find(span => span.textContent === '"Engineer"') ??
        el.querySelector('input')
      const row = anchor!.closest('div[class*="w-fit"]') as HTMLElement
      const rect = row.getBoundingClientRect()
      const spans = [...row.querySelectorAll(':scope > span')]
      const colon = spans.find(span => span.textContent === ':')
      const valueSpan = spans.find(span => span.textContent === '"Engineer"')
      const input = row.querySelector('input')
      const key = [...row.querySelectorAll(':scope > button')].find(
        button => button.textContent === 'role',
      )
      const valueButton = [...row.querySelectorAll(':scope > button')].find(
        button => button.textContent === '"Engineer"',
      )
      const inputRect = input?.getBoundingClientRect()
      return {
        rowTop: rect.top,
        rowHeight: rect.height,
        colonLeft: colon ? colon.getBoundingClientRect().left : null,
        colonRight: colon ? colon.getBoundingClientRect().right : null,
        valueLeft: valueButton
          ? valueButton.getBoundingClientRect().left
          : valueSpan
            ? valueSpan.getBoundingClientRect().left
            : (inputRect?.left ?? null),
        valueWidth: valueButton
          ? valueButton.getBoundingClientRect().width
          : (valueSpan?.getBoundingClientRect().width ?? null),
        keyWidth: key ? key.getBoundingClientRect().width : null,
        inputWidth: inputRect?.width ?? null,
        ringLeft: input && inputRect
          ? inputRect.left - Number.parseFloat(getComputedStyle(input).outlineOffset)
          : null,
      }
    })

  const before = await geometry()

  // Renaming the key: the input takes the key's exact box, so the colon and the
  // value behind it keep their positions and the row keeps its height.
  await demo.evaluate(el => {
    ;[...el.querySelectorAll('button')]
      .find(button => button.textContent === 'role')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
  })
  await expect(demo.locator('input')).toBeVisible()
  const renaming = await geometry()
  expect(renaming.inputWidth).toBeCloseTo(before.keyWidth!, 0)
  expect(renaming.rowTop).toBeCloseTo(before.rowTop, 0)
  expect(renaming.rowHeight).toBeCloseTo(before.rowHeight, 0)
  expect(renaming.colonLeft).toBeCloseTo(before.colonLeft!, 0)
  expect(renaming.valueLeft).toBeCloseTo(before.valueLeft!, 0)

  // Typing past the field width scrolls inside it: nothing in the row moves.
  await page.keyboard.type('a-very-long-renamed-key')
  const renamingTyped = await geometry()
  expect(renamingTyped.rowHeight).toBeCloseTo(before.rowHeight, 0)
  expect(renamingTyped.colonLeft).toBeCloseTo(before.colonLeft!, 0)
  expect(renamingTyped.inputWidth).toBeCloseTo(renaming.inputWidth!, 0)
  await page.keyboard.press('Escape')

  // Editing the value: the field lands on the displayed value's box (quotes
  // included) with no shift, and the wider colon→value spacing keeps its ring
  // clear of the colon.
  await demo.evaluate(el => {
    ;[...el.querySelectorAll('button')]
      .find(button => button.textContent === '"Engineer"')
      ?.click()
  })
  await expect(demo.locator('input')).toBeVisible()
  const editingValue = await geometry()
  expect(editingValue.rowTop).toBeCloseTo(before.rowTop, 0)
  expect(editingValue.rowHeight).toBeCloseTo(before.rowHeight, 0)
  expect(editingValue.colonLeft).toBeCloseTo(before.colonLeft!, 0)
  expect(editingValue.valueLeft).toBeCloseTo(before.valueLeft!, 0)
  expect(editingValue.ringLeft!).toBeGreaterThanOrEqual(editingValue.colonRight!)
  expect(editingValue.inputWidth).toBeCloseTo(before.valueWidth!, 0)
})

test('showcase: double-clicking a StructureTree key or value puts the caret at the end', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('"Engineer"')

  const caret = (length: number) => [length, length, length]

  // The value button enters edit on the first click, so the second click of a
  // double-click lands inside the freshly mounted field; the caret must still
  // land at the end rather than the browser selecting the word.
  await demo.locator('button').filter({ hasText: '"Engineer"' }).first().dblclick()
  const valueInput = demo.locator('input')
  await expect(valueInput).toBeVisible()
  await expect
    .poll(() => valueInput.evaluate((el: HTMLInputElement) => [el.value.length, el.selectionStart, el.selectionEnd]))
    .toEqual(caret(8))

  // Once the field is open, a double-click selects the whole value again.
  await valueInput.dblclick()
  await expect
    .poll(() => valueInput.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]))
    .toEqual([0, 8])

  // The key rename field, mounted by the double-click itself, behaves the same.
  await page.keyboard.press('Escape')
  await demo.getByRole('button', { name: 'role', exact: true }).dblclick()
  const nameInput = demo.locator('input')
  await expect(nameInput).toBeVisible()
  await expect
    .poll(() => nameInput.evaluate((el: HTMLInputElement) => [el.value.length, el.selectionStart, el.selectionEnd]))
    .toEqual(caret(4))
  await nameInput.dblclick()
  await expect
    .poll(() => nameInput.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]))
    .toEqual([0, 4])
})

test('showcase: a StructureTree row action pair sits tight and vertically centered', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('"Engineer"')

  const pair = await demo.evaluate(el => {
    const button = (name: string) =>
      [...el.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === name)!
    const edit = button('Edit $.role').getBoundingClientRect()
    const copy = button('Copy $.role').getBoundingClientRect()
    return {
      gap: copy.left - edit.right,
      editCenter: edit.top + edit.height / 2,
      copyCenter: copy.top + copy.height / 2,
    }
  })

  expect(pair.gap).toBeGreaterThanOrEqual(0)
  expect(pair.gap).toBeLessThanOrEqual(2)
  expect(pair.editCenter).toBeCloseTo(pair.copyCenter, 0)
})

test('showcase: StructureTree hints use the custom tooltip, never a native title', async ({
  page,
}) => {
  await page.goto('/components/structure-tree')
  await page.waitForLoadState('networkidle')

  const demo = showcaseDemo(page)
  await expect(demo).toContainText('"Engineer"')

  // The key rename hint: no native `title`, the shared Tooltip renders it.
  const key = demo.getByRole('button', { name: 'role', exact: true })
  expect(await key.getAttribute('title')).toBeNull()
  await key.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Double-click to rename')
  await page.mouse.move(2, 2)
  await expect(page.getByRole('tooltip')).toHaveCount(0)

  // The value hint carries its node path and is custom too. Its Tooltip sits
  // flush in the button, so no stray whitespace widens the row's text.
  const value = demo.locator('button').filter({ hasText: '"Engineer"' }).first()
  expect(await value.getAttribute('title')).toBeNull()
  const valueText = await value.textContent()
  expect(valueText).toBe(valueText?.trim())
  await value.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Edit $.role')
})
