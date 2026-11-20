import { expect, test, type Page } from '@playwright/test'
import { replaceSnippet, showCodeToggle, showcaseDemo, snippetEditor, snippetError } from './helpers'

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
  await showCodeToggle(page).click()
  await expect(snippetEditor(page)).toBeVisible()
  await replaceSnippet(page, snippet)
  await expect(showcaseDemo(page).locator(selector)).toHaveCount(count, { timeout: 20000 })
  await expect(snippetError(page)).toHaveCount(0)
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
  return showcaseDemo(page).locator(selector).evaluateAll(nodes =>
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
    // A button takes the text field's own text metrics, so one size step is one
    // label size and one row box across controls.
    expect(row.font / size).toBeCloseTo(0.875, 2)
    expect(row.line / size).toBeCloseTo(1.279, 3)
    expect(row.padLeft / size).toBeCloseTo(0.65, 2)
    expect(row.padTop / size).toBeCloseTo(0.39375, 2)
    expect(row.radius / size).toBeCloseTo(0.375, 2)
  })
})

test('numeric size keeps a Button on the TextInput box height', async ({ page }) => {
  const snippet = [
    '<script>let t = $state("")</script>',
    '<div class="flex flex-col items-start gap-2">',
    ...SIZES.map(
      s =>
        `  <div data-row="${s}" class="flex items-center gap-2">\n` +
        `    <TextInput bind:value={t} ariaLabel="f${s}" size={${s}} />\n` +
        `    <Button size={${s}}>Label</Button>\n` +
        `    <Button variant="primary" size={${s}}>Label</Button>\n` +
        `    <Button variant="danger" size={${s}}>Label</Button>\n` +
        `    <Button variant="primary" size={${s}} ariaLabel="icon">\n` +
        '      {#snippet icon()}<CheckIcon />{/snippet}\n' +
        '    </Button>\n' +
        '  </div>',
    ),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/button', snippet, SIZES.length, '[data-row]')

  const rows = await showcaseDemo(page)
    .locator('[data-row]')
    .evaluateAll(nodes =>
      nodes.map(row => ({
        size: row.getAttribute('data-row'),
        heights: [...row.querySelectorAll('input, button')].map(el => el.getBoundingClientRect().height),
      })),
    )
  for (const { size, heights } of rows) {
    // The field, the bordered secondary button, both filled variants (which
    // carry the frame as a transparent border), and an icon-only filled button
    // all share one outer box.
    expect(heights, `size ${size} renders five controls`).toHaveLength(5)
    for (const height of heights) expect(Math.abs(height - heights[0]!), `size ${size} height ${height}`).toBeLessThan(0.5)
  }
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
    expect(row.font / size).toBeCloseTo(0.875, 2)
    expect(row.line / size).toBeCloseTo(1.279, 3)
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
  const icons = await showcaseDemo(page)
    .locator('svg')
    .evaluateAll(nodes => nodes.map(node => parseFloat(node.getAttribute('width') ?? '0')))
  rows.forEach((row, i) => {
    const size = SIZES[i]!
    expect(row.font / size).toBeCloseTo(0.875, 2)
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
    expect(row.font / size).toBeCloseTo(0.875, 2)
    // The trigger box is the text field's own box: same horizontal and vertical
    // padding, so the two land on one height in a shared row.
    expect(row.padLeft / size).toBeCloseTo(0.5625, 2)
    expect(row.padTop / size).toBeCloseTo(0.39375, 2)
    // The chevron gutter is its own size ratio (`chevronGap`), independent of
    // the text padding, so a padding retune leaves it where it is.
    expect(row.padRight / size).toBeCloseTo(0.4, 2)
    expect(row.minWidth / size).toBeCloseTo(7, 2)
  })
})

// The select box takes the input chrome's font, line, and padding, so a trigger
// and a text field sit level in one row: their rendered boxes must match at
// every size, not merely their emitted vars (jsdom cannot prove that).
test('a SelectDropdown trigger and a TextInput render the same box height', async ({ page }) => {
  const snippet = [
    '<script>',
    '  let v = $state("two")',
    '  const opts = ["one", "two"]',
    '</script>',
    '<div class="flex flex-col items-start gap-2">',
    ...SIZES.flatMap(s => [
      `  <TextInput value="x" ariaLabel="i${s}" size={${s}} />`,
      `  <SelectDropdown activeValue={v} ariaLabel="s${s}" size={${s}} options={opts} onSelect={n => (v = n)} />`,
    ]),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/select-dropdown', snippet, SIZES.length, 'button[role=combobox]')

  const boxes = await showcaseDemo(page)
    .locator('input[aria-label^="i"], button[role=combobox]')
    .evaluateAll(nodes =>
      nodes.map(el => {
        const box = el.getBoundingClientRect()
        return { label: el.getAttribute('aria-label') ?? '', height: box.height }
      }),
    )
  expect(boxes).toHaveLength(SIZES.length * 2)
  SIZES.forEach(size => {
    const field = boxes.find(box => box.label === `i${size}`)
    const trigger = boxes.find(box => box.label === `s${size}`)
    expect(field, `text field at size ${size}`).toBeTruthy()
    expect(trigger, `select trigger at size ${size}`).toBeTruthy()
    expect(trigger!.height).toBeCloseTo(field!.height, 1)
  })
})

test('numeric size scales the Buttons gap by a constant ratio', async ({ page }) => {
  const snippet = [
    '<div class="flex flex-col items-start gap-2">',
    ...SIZES.map(s => `  <Buttons size={${s}}><Button>a</Button><Button>b</Button></Buttons>`),
    '</div>',
  ].join('\n')
  // The row carries `shrink-0`; nothing else in the demo does.
  await applySnippet(page, '/components/buttons', snippet, SIZES.length, 'div.shrink-0')

  const gaps = await showcaseDemo(page)
    .locator('div.shrink-0')
    .evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).rowGap)))
  expect(gaps).toHaveLength(SIZES.length)
  gaps.forEach((gap, i) => {
    expect(gap / SIZES[i]!).toBeCloseTo(0.5, 2)
  })
})

test('numeric size scales the Tooltip hint box by a constant ratio', async ({ page }) => {
  await page.goto('/components/tooltip')
  await page.waitForLoadState('networkidle')

  const sizeValue = page.getByRole('combobox', { name: 'size value', exact: true })
  const trigger = showcaseDemo(page).getByRole('button', { name: 'Apply' })
  const tip = page.getByRole('tooltip')

  // The size Value is a combobox, so drive it through the named steps. Clearing
  // first opens the panel unfiltered by the old value.
  for (const [index, [step, size]] of (
    [
      ['xs', 12],
      ['xl', 20],
    ] as const
  ).entries()) {
    // The first pick starts from the unset default, so there is no clear slot
    // yet; later picks clear first so the panel opens unfiltered.
    if (index > 0) {
      await page.getByRole('button', { name: 'Clear size' }).click()
    }
    await sizeValue.click()
    await page.getByRole('option', { name: step, exact: true }).click()
    await trigger.hover()
    await expect(tip).toBeVisible()
    const box = await tip.evaluate(el => {
      const cs = getComputedStyle(el)
      return {
        font: parseFloat(cs.fontSize),
        padLeft: parseFloat(cs.paddingLeft),
        padTop: parseFloat(cs.paddingTop),
        radius: parseFloat(cs.borderTopLeftRadius),
      }
    })
    // 0.75 font, 0.5/0.25 padding, and the 0.25 radius: the original `md` box
    // (12px on `text-xs`, `px-2 py-1`, `rounded`) scaled by the dimension.
    expect(box.font / size).toBeCloseTo(0.75, 2)
    expect(box.padLeft / size).toBeCloseTo(0.5, 2)
    expect(box.padTop / size).toBeCloseTo(0.25, 2)
    expect(box.radius / size).toBeCloseTo(0.25, 2)
  }
})

test('numeric size scales DataTable cells by a constant ratio', async ({ page }) => {
  const snippet = [
    '<script>',
    "  const rows = [{ id: 1, name: 'alpha' }]",
    "  const columns = [{ key: 'name', header: 'Name' }]",
    '</script>',
    '<div class="flex flex-col gap-2">',
    ...SIZES.map(s => `  <DataTable size={${s}} rows={rows} columns={columns} rowId={r => r.id} />`),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/data-table', snippet, SIZES.length, 'tbody td')

  // One cell per table, in snippet order.
  const cells = await showcaseDemo(page)
    .locator('tbody td')
    .evaluateAll(nodes =>
      nodes.map(el => {
          const cs = getComputedStyle(el)
          return {
            font: parseFloat(cs.fontSize),
            line: parseFloat(cs.lineHeight),
            padLeft: parseFloat(cs.paddingLeft),
            padTop: parseFloat(cs.paddingTop),
          }
        }),
    )
  expect(cells).toHaveLength(SIZES.length)
  cells.forEach((cell, i) => {
    const size = SIZES[i]!
    expect(cell.font / size).toBeCloseTo(0.875, 2)
    expect(cell.line / size).toBeCloseTo(1.25, 2)
    expect(cell.padLeft / size).toBeCloseTo(0.75, 2)
    expect(cell.padTop / size).toBeCloseTo(0.5, 2)
  })
})

test('numeric size scales DataGrid cells by a constant ratio', async ({ page }) => {
  const snippet = [
    '<script>',
    "  const rows = [['Name'], ['alpha']]",
    '</script>',
    '<div class="flex flex-col gap-2">',
    ...SIZES.map(
      s =>
        `  <div class="h-28 w-72"><DataGrid size={${s}} value={rows} initialColumnWidths={['80']} /></div>`,
    ),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/data-grid', snippet, SIZES.length, 'tbody textarea')

  const cells = await showcaseDemo(page)
    .locator('tbody textarea')
    .evaluateAll(nodes =>
      nodes.map(el => {
        const cs = getComputedStyle(el)
        return {
          font: parseFloat(cs.fontSize),
          padLeft: parseFloat(cs.paddingLeft),
          padTop: parseFloat(cs.paddingTop),
        }
      }),
    )
  expect(cells).toHaveLength(SIZES.length)
  cells.forEach((cell, i) => {
    const size = SIZES[i]!
    expect(cell.font / size).toBeCloseTo(0.875, 2)
    expect(cell.padLeft / size).toBeCloseTo(0.5, 2)
    expect(cell.padTop / size).toBeCloseTo(0.25, 2)
  })
})

test('numeric size scales the CodeEditor text and content padding by a constant ratio', async ({
  page,
}) => {
  const snippet = [
    '<script>',
    '  let doc = $state("const a = 1")',
    '</script>',
    '<div class="flex flex-col gap-2">',
    ...SIZES.map(s => `  <div class="h-32 w-64"><CodeEditor size={${s}} bind:content={doc} /></div>`),
    '</div>',
  ].join('\n')
  await applySnippet(page, '/components/code-editor', snippet, SIZES.length, '.cm-content')

  const content = await showcaseDemo(page)
    .locator('.cm-content')
    .evaluateAll(nodes =>
      nodes.map(el => {
        const cs = getComputedStyle(el)
        return {
          font: parseFloat(cs.fontSize),
          padTop: parseFloat(cs.paddingTop),
          padLeft: parseFloat(cs.paddingLeft),
        }
      }),
    )
  expect(content).toHaveLength(SIZES.length)
  content.forEach((cell, i) => {
    const size = SIZES[i]!
    expect(cell.font / size).toBeCloseTo(0.875, 2)
    expect(cell.padTop / size).toBeCloseTo(0.75, 2)
    expect(cell.padLeft / size).toBeCloseTo(0.5, 2)
  })
})
