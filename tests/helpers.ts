import type { Locator, Page } from '@playwright/test'

// Controls rendered inside the demo region, so a route that only renders its
// shared chrome fails instead of passing vacuously.
export const DEMO_CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="tab"]'

// The Spinner demo is purely presentational and renders no interactive
// control of its own, so it asserts the SVG it renders instead.
export const PRESENTATIONAL_SLUGS = new Set(['spinner', 'icons'])

// The showcase shell's own hooks (ShowcasePage.svelte). Anchor every shell
// locator on these rather than on the element nesting around them, so a layout
// restructure cannot silently match nothing.
const SHOWCASE_BLOCK = '[data-showcase-block]'
const SHOWCASE_DEMO = '[data-showcase-demo]'
const SHOWCASE_TITLEBAR = '[data-showcase-titlebar]'
const SHOWCASE_PROPS = '[data-showcase-props]'

export function showcaseBlock(page: Page): Locator {
  return page.locator(SHOWCASE_BLOCK)
}

// The live demo region. `section` scopes the query to a demo hook nested in a
// larger container; the shell renders exactly one demo per page.
export function showcaseDemo(page: Page, section?: Locator): Locator {
  return (section ?? page).locator(SHOWCASE_DEMO).first()
}

export function showcaseTitlebar(page: Page): Locator {
  return page.locator(SHOWCASE_TITLEBAR)
}

export function showcaseProps(page: Page): Locator {
  return page.locator(SHOWCASE_PROPS)
}

// Title-row code toggle; the shell renders it in the demo block's titlebar.
export function showCodeToggle(page: Page): Locator {
  return showcaseTitlebar(page).getByRole('button', { name: 'Show code', exact: true })
}

export function hideCodeToggle(page: Page): Locator {
  return showcaseTitlebar(page).getByRole('button', { name: 'Hide code', exact: true })
}

// Title-row playground reset; distinct from the code region's draft reset and
// from any demo-owned reset.
export function headerReset(page: Page): Locator {
  return showcaseTitlebar(page).getByRole('button', { name: 'Reset', exact: true })
}

// The shell-owned code region; a portaled dialog hosts its own editor instead.
export function snippetRegion(page: Page): Locator {
  return page.getByRole('region', { name: 'Code' })
}

// The CodeMirror content of the shell's code region, or of a dialog passed as
// `section`. CodeMirror owns the contenteditable, so `.fill()` does not apply.
export function snippetEditor(page: Page, section?: Locator): Locator {
  return (section ?? snippetRegion(page)).locator('.cm-content')
}

// A compile error renders as an alert inside the demo block, above the editor.
export function snippetError(page: Page): Locator {
  return showcaseBlock(page).getByRole('alert')
}

// Replace the whole snippet buffer through the clipboard: CodeMirror owns the
// contenteditable, so `.fill()` does not apply, and a clipboard paste routes
// through the editor's own paste handling without per-key bracket auto-close.
// `section` selects a dialog's editor; the shell's code region is the default.
export async function replaceSnippet(page: Page, source: string, section?: Locator) {
  const editor = snippetEditor(page, section)
  await editor.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.evaluate(text => navigator.clipboard.writeText(text), source)
  await page.keyboard.press('ControlOrMeta+V')
}

export function normalizeDemoText(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

// CodeMirror virtualizes long buffers, so only the visible lines are in the
// DOM. Scroll the scroller in steps until the text is rendered, then report
// whether it was found. `section` selects a dialog's editor; the shell's code
// region is the default.
export async function editorContains(page: Page, text: string, section?: Locator): Promise<boolean> {
  const region = section ?? snippetRegion(page)
  const scroller = region.locator('.cm-scroller')
  const content = snippetEditor(page, section)
  // The editor renders only the lines near the viewport and skips work while it
  // is off screen, so bring it into view before scrolling through it.
  await content.scrollIntoViewIfNeeded()
  const steps = 30
  for (let index = 0; index <= steps; index += 1) {
    if (((await content.textContent()) ?? '').includes(text)) return true
    await scroller.evaluate((element, ratio) => {
      element.scrollTop = (element.scrollHeight - element.clientHeight) * ratio
    }, index / steps)
    await page.waitForTimeout(30)
  }
  return ((await content.textContent()) ?? '').includes(text)
}
