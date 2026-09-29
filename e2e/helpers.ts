import type { Locator, Page } from '@playwright/test'

// Controls rendered inside the demo region (the `main` element), so a route
// that only renders its shared chrome fails instead of passing vacuously.
export const DEMO_CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="tab"]'

// The Spinner demo is purely presentational and renders no interactive
// control of its own, so it asserts the SVG it renders instead.
export const PRESENTATIONAL_SLUGS = new Set(['spinner', 'icons'])

// Replace the whole snippet buffer through the clipboard: CodeMirror owns the
// contenteditable, so `.fill()` does not apply, and a clipboard paste routes
// through the editor's own paste handling without per-key bracket auto-close.
export async function replaceSnippet(page: Page, section: Locator, source: string) {
  const editor = section.locator('.cm-content')
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
// whether it was found.
export async function editorContains(page: Page, section: Locator, text: string): Promise<boolean> {
  const scroller = section.locator('.cm-scroller')
  const content = section.locator('.cm-content')
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
