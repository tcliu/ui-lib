import { expect, test } from '@playwright/test';
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components';

// Controls rendered inside the demo region (the `main` element), so a route
// that only renders its shared chrome fails instead of passing vacuously.
const DEMO_CONTROLS =
	'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="tab"]';

// The Spinner demo is purely presentational and renders no interactive
// control of its own, so it asserts the SVG it renders instead.
const PRESENTATIONAL_SLUGS = new Set(['spinner', 'icons']);

test('showcase: index redirects to the two-pane component browser', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/components\/base-dialog$/);
	await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'BaseDialog' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'SelectDropdown' })).toBeVisible();
});

test('showcase: the left-pane search filters the component list', async ({ page }) => {
	await page.goto('/components/base-dialog');
	// Hydration binds the search input; wait for it before interacting.
	await page.waitForLoadState('networkidle');
	await page.getByRole('searchbox', { name: 'Search components' }).fill('spin');
	await expect(page.getByRole('link', { name: 'Spinner' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'BaseDialog' })).toHaveCount(0);
});

test('showcase: the theme icon menu changes the document theme', async ({ page }) => {
	await page.goto('/components/base-dialog');
	// Hydration attaches the menu trigger handler; wait for it before clicking.
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Theme' }).click();
	await page.getByRole('menuitemradio', { name: 'Light' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

for (const { slug, name } of SHOWCASE_COMPONENTS) {
	test(`showcase: ${name} page renders its demo`, async ({ page }) => {
		await page.goto(`/components/${slug}`);
		await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
		const demo = page.locator('main');
		const rendered = PRESENTATIONAL_SLUGS.has(slug)
			? demo.locator('svg').first()
			: demo.locator(DEMO_CONTROLS).first();
		await expect(rendered).toBeVisible();
	});
}

test('showcase: DataTable toolbar hosts search plus column selector and reset', async ({
  page
}) => {
  await page.goto('/components/data-table');
  await page.waitForLoadState('networkidle');
  const section = page.getByRole('region', { name: 'Default' });

  // The search box precedes the column selector and reset icons in DOM order.
  const search = section.getByRole('searchbox', { name: 'Search rows' });
  await expect(search).toBeVisible();
  const order = await section.evaluate(sectionEl => {
    const pos = (name: string) =>
      [...sectionEl.querySelectorAll('*')].findIndex(
        el => el.getAttribute('aria-label') === name
      );
    return [pos('Search rows'), pos('Choose columns'), pos('Reset columns')];
  });
  expect(order[0]).toBeGreaterThanOrEqual(0);
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);

  // Searching narrows the rows; the selector hides a column; reset restores it.
  const statusCell = section.locator('tbody td', { hasText: 'Active' }).first();
  await search.fill('Viewer');
  await expect(section.locator('tbody tr')).toHaveCount(1);
  await search.fill('');
  await expect(section.locator('tbody tr')).toHaveCount(10);
  await section.getByRole('button', { name: 'Choose columns' }).click();
  const panel = section.locator('.colchooser .panel');
  await expect(panel).toBeVisible();
  // The panel drops below the trigger, fully inside the viewport.
  const inViewport = await panel.evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  });
  expect(inViewport).toBe(true);
  await panel.locator('label', { hasText: 'Status' }).click();
  await expect(statusCell).toHaveCount(0);
  await section.getByRole('button', { name: 'Reset columns' }).click();
  await expect(section.locator('tbody td', { hasText: 'Active' }).first()).toBeVisible();

  // Resizable columns are off by default; the settings panel enables them.
  await expect(section.getByRole('button', { name: /^Resize / })).toHaveCount(0);

  // The row total rides at the pagination row's right edge.
  await expect(section.locator('nav').getByText('30 rows')).toBeVisible();
});

test('showcase: DataTable settings panel drives the demo table', async ({ page }) => {
  await page.goto('/components/data-table');
  await page.waitForLoadState('networkidle');
  // The settings panel is a plain div below the demo: its controls are
  // located page-wide while demo assertions stay inside the demo region,
  // whose title flips between Default and Customized with the form state.
  const demo = (name: string) => page.getByRole('region', { name });

  // Pristine: every field unset, the section reads Default.
  await expect(demo('Default')).toBeVisible();
  await expect(demo('Default').getByRole('searchbox', { name: 'Search rows' })).toBeVisible();
  await expect(demo('Default').locator('tbody input[type="checkbox"]')).toHaveCount(0);

  // Yes/No/unset tri-state: picking Yes enables selection and retitles.
  await page.getByRole('combobox', { name: 'Selectable rows' }).click();
  await page.getByRole('option', { name: 'Yes' }).click();
  await expect(demo('Customized').locator('tbody input[type="checkbox"]')).toHaveCount(10);
  await expect(demo('Customized')).toBeVisible();

  // The clear cross is smaller than standard icons and returns focus.
  const clearBox = await page
    .getByRole('button', { name: 'Clear selectable rows' })
    .locator('svg')
    .boundingBox();
  expect(clearBox?.width).toBe(12);
  expect(clearBox?.height).toBe(12);

  // The option panel spans at least the trigger width.
  await page.getByRole('combobox', { name: 'Dense padding' }).click();
  const panelWidths = await page.evaluate(() => {
    const panel = document.querySelector('[role="listbox"]');
    const trigger = document.querySelector('[aria-label="Dense padding"]');
    return {
      panel: panel?.getBoundingClientRect().width ?? 0,
      trigger: trigger?.getBoundingClientRect().width ?? 0
    };
  });
  expect(panelWidths.trigger).toBeGreaterThan(0);
  expect(panelWidths.panel).toBeGreaterThanOrEqual(panelWidths.trigger - 1);
  await page.keyboard.press('Escape');

  // The cross clears back to unset; the section reads Default again.
  await page.getByRole('button', { name: 'Clear selectable rows' }).click();
  await expect(demo('Default').locator('tbody input[type="checkbox"]')).toHaveCount(0);
  await expect(demo('Default')).toBeVisible();

  // Placeholder text flows into the demo and the regenerated snippet source.
  await page.getByLabel('Search placeholder').fill('Find rows');
  await expect(demo('Customized').getByRole('searchbox', { name: 'Search rows' })).toHaveAttribute(
    'placeholder',
    'Find rows'
  );
  await demo('Customized').getByRole('button', { name: 'Show code' }).click();
  await expect(demo('Customized').locator('.cm-content')).toBeVisible();
  expect(
    await editorContains(page, demo('Customized'), 'searchPlaceholder="Find rows"')
  ).toBe(true);
  await demo('Customized').getByRole('button', { name: 'Hide code' }).click();

  // Reset returns every field to unset.
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(demo('Default')).toBeVisible();
  await expect(demo('Default').getByRole('searchbox', { name: 'Search rows' })).toHaveAttribute(
    'placeholder',
    'Search'
  );
});

test('showcase: BaseDialog page opens the dialog with content', async ({ page }) => {
  await page.goto('/components/base-dialog');
	// Hydration attaches the click handler; wait for it before interacting.
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Open dialog' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByTestId('dialog-body')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});

test('showcase: the picker toggle hides and shows the component pane', async ({ page }) => {
	await page.goto('/components/base-dialog');
	// Hydration binds the toggle handler; wait for it before interacting.
	await page.waitForLoadState('networkidle');
	const toggle = page.getByRole('button', { name: 'Toggle component picker' });
	const search = page.getByRole('searchbox', { name: 'Search components' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(search).toBeVisible();
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(search).toBeHidden();
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(search).toBeVisible();
});

test('showcase: the component pane floats above content on narrow viewports', async ({ page }) => {
	await page.setViewportSize({ width: 500, height: 800 });
	await page.goto('/components/base-dialog');
	// Hydration binds the drawer handlers; the docked slide-in (200ms) must
	// also settle before measuring boxes.
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(400);
	const search = page.getByRole('searchbox', { name: 'Search components' });
	const backdrop = page.getByRole('button', { name: 'Close pane' });
	await expect(search).toBeVisible();
	await expect(backdrop).toBeVisible();
	// The floating overlay contains focus: the main column is inert behind it.
	await expect(page.locator('main')).toHaveAttribute('inert', '');

	// Floating removes the pane from the flow: it overlaps the main column
	// instead of squeezing beside it.
	const paneBox = await search.boundingBox();
	const headingBox = await page.getByRole('heading', { level: 1, name: 'BaseDialog' }).boundingBox();
	expect(paneBox).not.toBeNull();
	expect(headingBox).not.toBeNull();
	expect(paneBox!.x + paneBox!.width).toBeGreaterThan(headingBox!.x);

	// Escape closes the overlay, returns focus to the main column, and lifts
	// its inert state.
	await page.keyboard.press('Escape');
	await expect(search).toBeHidden();
	await expect(backdrop).toBeHidden();
	await expect(page.locator('main')).not.toHaveAttribute('inert', '');
	await expect(page.locator('main')).toBeFocused();

	// The header toggle reopens the drawer.
	await page.getByRole('button', { name: 'Toggle component picker' }).click();
	await expect(search).toBeVisible();
	await expect(backdrop).toBeVisible();
});

test('showcase: the component pane docks beside content on wide viewports', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/components/base-dialog');
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(400);
	await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Close pane' })).toHaveCount(0);
	// The pane is docked in the flow, not overlaying.
	await expect(page.locator('[data-drawer-presentation="docked"]')).toHaveCount(1);

	// Docked shares the row: the pane ends where the main column begins.
	const paneBox = await page.locator('aside').boundingBox();
	const mainBox = await page.locator('main').boundingBox();
	expect(paneBox).not.toBeNull();
	expect(mainBox).not.toBeNull();
	expect(Math.abs(paneBox!.x + paneBox!.width - mainBox!.x)).toBeLessThanOrEqual(2);
});

test('showcase: the AppShell demo opens a floating right drawer', async ({ page }) => {
	await page.goto('/components/app-shell');
	await page.waitForLoadState('networkidle');
	const demo = page.getByRole('region', { name: 'Default' });
	await expect(demo.getByText('Components', { exact: true })).toBeVisible();

	// Enabling the right pane docks it beside the demo content (desktop).
	await page.getByRole('combobox', { name: 'Right pane' }).click();
	await page.getByRole('option', { name: 'Open' }).click();
	const customized = page.getByRole('region', { name: 'Customized' });
	await expect(customized.getByRole('button', { name: 'Hide right pane' })).toBeVisible();

	// Pinning floating mode overlays both drawers behind one backdrop.
	await page.getByRole('combobox', { name: 'Drawer mode' }).click();
	await page.getByRole('option', { name: 'Floating' }).click();
	await expect(customized.getByRole('button', { name: 'Close pane' })).toBeVisible();
	// The docked panes slide out (200ms); wait until they detach so later
	// assertions never catch a mid-transition duplicate.
	await expect(customized.locator('[data-drawer-presentation="docked"]')).toHaveCount(0);

	// Escape closes the right drawer first, then the left one.
	await page.keyboard.press('Escape');
	await expect(customized.getByRole('button', { name: 'Show right pane' })).toBeVisible();
	await expect(customized.getByText('Components', { exact: true })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(customized.getByRole('button', { name: 'Close pane' })).toHaveCount(0);
	await expect(customized.getByText('Components', { exact: true })).toHaveCount(0);
});

test('showcase: a deep link selects its component in the picker', async ({ page }) => {
	await page.goto('/components/tabs');
	await expect(page.getByRole('heading', { level: 1, name: 'Tabs' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Tabs' })).toHaveAttribute('aria-current', 'page');
});

test('showcase: an unknown slug renders the localized not-found state', async ({ page }) => {
	await page.goto('/components/nope');
	await expect(page.getByRole('heading', { level: 1, name: 'Component not found' })).toBeVisible();
});

// Replace the whole snippet buffer through the clipboard: CodeMirror owns the
// contenteditable, so `.fill()` does not apply, and a clipboard paste routes
// through the editor's own paste handling without per-key bracket auto-close.
async function replaceSnippet(page: import('@playwright/test').Page, section: import('@playwright/test').Locator, source: string) {
	const editor = section.locator('.cm-content');
	await editor.click();
	await page.keyboard.press('ControlOrMeta+A');
	await page.evaluate(text => navigator.clipboard.writeText(text), source);
	await page.keyboard.press('ControlOrMeta+V');
}

function normalizeDemoText(text: string | null): string {
	return (text ?? '').replace(/\s+/g, ' ').trim();
}

// CodeMirror virtualizes long buffers, so only the visible lines are in the
// DOM. Scroll the scroller in steps until the text is rendered, then report
// whether it was found.
async function editorContains(
	page: import('@playwright/test').Page,
	section: import('@playwright/test').Locator,
	text: string
): Promise<boolean> {
	const scroller = section.locator('.cm-scroller');
	const content = section.locator('.cm-content');
	const steps = 30;
	for (let index = 0; index <= steps; index += 1) {
		if (((await content.textContent()) ?? '').includes(text)) return true;
		await scroller.evaluate((element, ratio) => {
			element.scrollTop = (element.scrollHeight - element.clientHeight) * ratio;
		}, index / steps);
		await page.waitForTimeout(30);
	}
	return ((await content.textContent()) ?? '').includes(text);
}

// A section's snippet must reproduce its own static demo: with default state,
// opening the Show-code toggle compiles clean (no alert) and leaves the demo
// row's text unchanged until the user edits.
for (const { slug, name } of SHOWCASE_COMPONENTS) {
	test(`showcase: ${name} snippets reproduce their static demos`, async ({ page }) => {
		await page.goto(`/components/${slug}`);
		// Hydration binds the toggle and compile handlers; wait before interacting.
		await page.waitForLoadState('networkidle');
		// Direct children only: the props table section has no toggle and the
		// editor's own section nests inside its demo section once opened.
		const sections = page.locator('main > div > section');
		await expect(await sections.count()).toBeGreaterThan(0);
		for (let index = 0; index < (await sections.count()); index += 1) {
			const section = sections.nth(index);
			const toggle = section.getByRole('button', { name: 'Show code' });
			if ((await toggle.count()) === 0) continue;
			const demo = section.locator(':scope > div:nth-child(2)');
			const before = normalizeDemoText(await demo.textContent());
			const handle = await demo.elementHandle();
			await toggle.click();
			await expect(section.locator('.cm-content')).toBeVisible();
			// A clean compile swaps the static demo row for the live instance;
			// a failed compile keeps the row and shows an inline error instead.
			await expect
				.poll(
					async () =>
						(await section.getByRole('alert').count()) > 0 ||
						(handle ? await handle.evaluate(element => !element.isConnected) : false),
					{ timeout: 15000 }
				)
				.toBe(true);
			await expect(section.getByRole('alert')).toHaveCount(0);
			expect(normalizeDemoText(await demo.textContent())).toBe(before);
			await section.getByRole('button', { name: 'Hide code' }).click();
			await expect(section.locator('.cm-content')).toHaveCount(0);
		}
	});
}

test('showcase: the reset button restores a snippet demo', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/components/button');
	// Hydration binds the toggle, reset, and compile handlers; wait before interacting.
	await page.waitForLoadState('networkidle');
	const section = page.getByRole('region', { name: 'Default' });
	const demo = section.locator(':scope > div:nth-child(2)');
	const before = normalizeDemoText(await demo.textContent());
	await section.getByRole('button', { name: 'Show code' }).click();
	await expect(section.locator('.cm-content')).toBeVisible();

	// Editing the snippet recompiles it and updates the section demo in place.
	await replaceSnippet(page, section, '<Button variant="primary">Live demo</Button>');
	await expect(section.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 });

	// Reset restores the seed source, and the normal debounce/compile pipeline
	// recompiles it back to the initial demo. The page's settings panel has its
	// own Reset, so scope to the editor's draft-reset inside the code region.
	const codeRegion = section.getByRole('region', { name: 'Code' });
	await codeRegion.getByRole('button', { name: 'Reset', exact: true }).click();
	await expect(section.getByRole('button', { name: 'Apply (0)' })).toBeVisible({
		timeout: 10000
	});
	await expect(section.getByRole('button', { name: 'Live demo' })).toHaveCount(0);
	expect(normalizeDemoText(await demo.textContent())).toBe(before);
});

test('showcase: a code snippet edits its section demo in place', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/components/button');
	// Hydration binds the toggle, copy, and compile handlers; wait before interacting.
	await page.waitForLoadState('networkidle');
	const section = page.getByRole('region', { name: 'Default' });
	const toggle = section.getByRole('button', { name: 'Show code' });
	// The static demo paints before any compilation runs.
	await expect(section.getByRole('button', { name: 'Apply (0)' })).toBeVisible();
	await toggle.click();

	// There is no separate preview block; the editor opens below the demo row.
	await expect(section.locator('.cm-content')).toBeVisible();
	await expect(section.getByTestId('snippet-preview')).toHaveCount(0);

	// Editing the snippet recompiles it and updates the section demo in place.
	await replaceSnippet(page, section, '<Button variant="primary">Live demo</Button>');
	await expect(section.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 });
	await expect(section.getByRole('button', { name: 'Apply (0)' })).toHaveCount(0);

	// The copy button still copies the edited source.
	await section.getByRole('button', { name: 'Copy code' }).click();
	await expect(section.getByRole('status')).toHaveText('Copied');
	await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
		'<Button variant="primary">Live demo</Button>'
	);

	// Invalid source shows an inline error and keeps the current demo on screen.
	await replaceSnippet(page, section, '<Button variant="primary">Broken');
	await expect(section.getByRole('alert')).toBeVisible();
	await expect(section.getByRole('button', { name: 'Live demo' })).toBeVisible();

	// Closing the toggle restores the static demo and clears the error.
	await section.getByRole('button', { name: 'Hide code' }).click();
	await expect(section.getByRole('button', { name: 'Apply (0)' })).toBeVisible();
	await expect(section.getByRole('alert')).toHaveCount(0);
	await expect(section.locator('.cm-content')).toHaveCount(0);
});
