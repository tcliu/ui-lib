import { expect, test, type Page } from '@playwright/test'
import { replaceSnippet } from './helpers'

// The numeric-size model renders every dimension metric through CSS custom
// properties consumed by var-driven Tailwind utilities. The vitest size tests
// assert the emitted vars but run in jsdom, which does not resolve CSS — they
// cannot prove the arbitrary utilities generate and apply. This spec checks the
// *computed* metrics in a real browser: a metric whose utility went missing
// renders at 0/default and fails here, and every metric must keep a constant
// ratio to the size.

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

const SIZES = [12, 14, 16, 18, 20]

// Render a snippet in the page's live playground and wait for its instances.
async function applySnippet(page: Page, path: string, snippet: string, count: number, selector: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.locator('main header').getByRole('button', { name: 'Show code' }).click()
  await expect(page.locator('main .cm-content').first()).toBeVisible()
  await replaceSnippet(page, page.locator('main'), snippet)
  await expect(page.locator(`[data-showcase-demo] ${selector}`)).toHaveCount(count, { timeout: 20000 })
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
}

interface Metrics {
  font: number
  padLeft: number
  padRight: number
  padTop: number
  radius: number
  line: number
  minWidth: number
}

function measure(page: Page, selector: string): Promise<Metrics[]> {
  return page.locator(`[data-showcase-demo] ${selector}`).evaluateAll(nodes =>
    nodes.map(el => {
      const cs = getComputedStyle(el)
      return {
        font: parseFloat(cs.fontSize),
        padLeft: parseFloat(cs.paddingLeft),
        padRight: parseFloat(cs.paddingRight),
        padTop: parseFloat(cs.paddingTop),
        radius: parseFloat(cs.borderTopLeftRadius),
        line: parseFloat(cs.lineHeight),
        minWidth: parseFloat(cs.minWidth),
      }
    }),
  )
}

test('numeric size scales every Button metric by a constant ratio', async ({ page }) => {
  const snippet = [
    '<div class="flex items-start gap-2">',
    ...SIZES.map(s => `  <Button size={${s}}>aa</Button>`),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/button', snippet, SIZES.length, 'button')

  const rows = await measure(page, 'button')
  rows.forEach((row, i) => {
    const size = SIZES[i]!
    expect(row.font / size).toBeCloseTo(0.8125, 2)
    expect(row.line / size).toBeCloseTo(1.1607, 2)
    expect(row.padLeft / size).toBeCloseTo(0.65, 2)
    expect(row.padTop / size).toBeCloseTo(0.45, 2)
    expect(row.radius / size).toBeCloseTo(0.375, 2)
  })
})

test('numeric size scales every TextInput metric by a constant ratio', async ({ page }) => {
  const snippet = [
    '<script>let t = $state("")</script>',
    '<div class="flex flex-col items-start gap-2">',
    ...SIZES.map(s => `  <TextInput bind:value={t} ariaLabel="t${s}" size={${s}} />`),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/text-input', snippet, SIZES.length, 'input')

  const rows = await measure(page, 'input')
  rows.forEach((row, i) => {
    const size = SIZES[i]!
    expect(row.font / size).toBeCloseTo(0.8125, 2)
    expect(row.line / size).toBeCloseTo(1.1875, 2)
    expect(row.padLeft / size).toBeCloseTo(0.5625, 2)
    expect(row.padTop / size).toBeCloseTo(0.39375, 2)
  })
})

test('numeric size scales the SearchInput box and icon by a constant ratio', async ({ page }) => {
  const snippet = [
    '<script>let q = $state("")</script>',
    '<div class="flex flex-col items-start gap-2">',
    ...SIZES.map(s => `  <SearchInput bind:value={q} ariaLabel="s${s}" size={${s}} />`),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/search-input', snippet, SIZES.length, 'input')

  const rows = await measure(page, 'input')
  const icons = await page
    .locator('[data-showcase-demo] svg')
    .evaluateAll(nodes => nodes.map(node => parseFloat(node.getAttribute('width') ?? '0')))
  rows.forEach((row, i) => {
    const size = SIZES[i]!
    expect(row.font / size).toBeCloseTo(0.8125, 2)
    expect(row.padLeft / size).toBeCloseTo(1.8, 2)
    // The search icon trims the icon slot, so its glyph rides 0.9× the shared
    // icon ratio of the dimension.
    expect(icons[i]! / size).toBeCloseTo(0.73125, 2)
  })
})

test('numeric size scales the SelectDropdown trigger by a constant ratio', async ({ page }) => {
  const snippet = [
    '<script>let v = $state("two")</script>',
    '<div class="flex flex-col items-start gap-2">',
    ...SIZES.map(
      s =>
        `  <SelectDropdown activeValue={v} ariaLabel="d${s}" size={${s}} options={options} onSelect={n => (v = n)} />`,
    ),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/select-dropdown', snippet, SIZES.length, 'button[role=combobox]')

  const rows = await measure(page, 'button[role=combobox]')
  rows.forEach((row, i) => {
    const size = SIZES[i]!
    expect(row.font / size).toBeCloseTo(0.8125, 2)
    expect(row.padLeft / size).toBeCloseTo(0.675, 2)
    // The right gutter is derived from the padding, not tuned beside it: the
    // computed right padding must track `padLeft × SELECT_GUTTER_SHARE`.
    expect(row.padRight / size).toBeCloseTo(0.3375, 2)
    expect(row.minWidth / size).toBeCloseTo(7, 2)
  })
})
