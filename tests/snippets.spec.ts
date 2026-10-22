import { expect, test } from '@playwright/test'
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components'
import {
  hideCodeToggle,
  normalizeDemoText,
  showCodeToggle,
  showcaseBlock,
  showcaseDemo,
  showcaseProps,
  snippetEditor,
  snippetError,
  snippetRegion,
} from './helpers'

// Every registered page is a converted page: opening the shell's title-row
// code toggle live-compiles the seed, which must reproduce the static demo
// with no error, and closing it restores the static demo and tears the editor
// down. Anchor on the shell's stable hooks (`data-showcase-block`,
// `data-showcase-titlebar`, `data-showcase-demo`) rather than DOM nesting, so
// a layout restructure cannot silently match nothing.
for (const { slug, name } of SHOWCASE_COMPONENTS) {
  test(`showcase: ${name} snippets reproduce their static demos`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    // Hydration binds the toggle and compile handlers; wait before interacting.
    await page.waitForLoadState('networkidle')

    const block = showcaseBlock(page)
    await expect(block).toHaveCount(1)
    const demo = showcaseDemo(page, block)
    await expect(demo).toBeVisible()

    // The props table appends a Value column (scoped: a docs demo like
    // FieldTable may render its own Value column in the demo region), and the
    // title row hosts the code toggle.
    await expect(
      showcaseProps(page).getByRole('columnheader', { name: 'Value' }),
    ).toBeVisible()
    const toggle = showCodeToggle(page)
    await expect(toggle).toHaveCount(1)

    // Opening Show code compiles the seed, which reproduces the static demo
    // with no inline error.
    const before = normalizeDemoText(await demo.textContent())
    await toggle.click()
    await expect(snippetEditor(page)).toBeVisible()
    await expect.poll(async () => normalizeDemoText(await demo.textContent()), { timeout: 15000 }).toBe(before)
    await expect(snippetError(page)).toHaveCount(0)

    // Closing restores the static demo and tears the code editor down. Scope
    // to the shell's Code region: a code-editor demo renders its own
    // `.cm-content` inside the demo and would defeat a page-wide count.
    await hideCodeToggle(page).click()
    await expect(snippetRegion(page)).toHaveCount(0)
    expect(normalizeDemoText(await demo.textContent())).toBe(before)
  })
}

// Converted showcase pages own a `SnippetPreview` and hand their `fields` to
// the shell, which hosts the code toggle in the demo block titlebar. The
// parameterized loop above drives the registry directly; this static list is
// the guard that a page added without a Value-column preview is caught rather
// than silently losing its snippet coverage. Keep it in step with the pages
// that pass a preview plus a Value column.
const CONVERTED_PAGE_SLUGS = [
  'app-shell',
  'autocomplete',
  'bar-chart',
  'base-dialog',
  'button',
  'buttons',
  'checkbox',
  'chip',
  'chip-dropdown',
  'code-editor',
  'column-chooser',
  'confirm-dialog',
  'copyable',
  'data-grid',
  'data-table',
  'date-input',
  'form-dialog',
  'editable-text',
  'field-table',
  'form-field',
  'icons',
  'lazy-code-editor',
  'menu',
  'number-input',
  'pagination',
  'password-input',
  'resizable',
  'search-input',
  'select-dropdown',
  'spinner',
  'splitter',
  'structure-tree',
  'tabs',
  'tag-input',
  'textarea',
  'text-input',
  'toast',
  'tooltip',
]

// The converted-page list is the registry's snippet set; guard that a page
// added to one is added to the other, or its snippet coverage silently drops.
test('showcase: the converted-page list matches the component registry', () => {
  expect([...CONVERTED_PAGE_SLUGS].sort()).toEqual(
    SHOWCASE_COMPONENTS.map(component => component.slug).sort(),
  )
})
