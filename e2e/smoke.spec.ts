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
	// recompiles it back to the initial demo.
	await section.getByRole('button', { name: 'Reset', exact: true }).click();
	await expect(section.getByRole('button', { name: 'primary' }).first()).toBeVisible({
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
	await expect(section.getByRole('button', { name: 'primary' }).first()).toBeVisible();
	await toggle.click();

	// There is no separate preview block; the editor opens below the demo row.
	await expect(section.locator('.cm-content')).toBeVisible();
	await expect(section.getByTestId('snippet-preview')).toHaveCount(0);

	// Editing the snippet recompiles it and updates the section demo in place.
	await replaceSnippet(page, section, '<Button variant="primary">Live demo</Button>');
	await expect(section.getByRole('button', { name: 'Live demo' })).toBeVisible({ timeout: 10000 });
	await expect(section.getByRole('button', { name: 'primary' })).toHaveCount(0);

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
	await expect(section.getByRole('button', { name: 'primary' }).first()).toBeVisible();
	await expect(section.getByRole('alert')).toHaveCount(0);
	await expect(section.locator('.cm-content')).toHaveCount(0);
});
