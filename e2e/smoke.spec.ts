import { expect, test } from '@playwright/test';
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components';

// Controls rendered inside the demo region (the `main` element), so a route
// that only renders its shared chrome fails instead of passing vacuously.
const DEMO_CONTROLS =
	'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="tab"]';

// The Spinner demo is purely presentational and renders no interactive
// control of its own, so it asserts the SVG it renders instead.
const PRESENTATIONAL_SLUGS = new Set(['spinner']);

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

test('showcase: a demo code snippet is editable and copyable', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/components/button');
	// Hydration binds the toggle and copy handlers; wait before interacting.
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Show code' }).click();
	const snippet = page.getByRole('textbox', { name: 'Code' });
	await expect(snippet).toBeVisible();
	await snippet.fill('<Button variant="primary">Hello</Button>');
	await page.getByRole('button', { name: 'Copy code' }).click();
	await expect(page.getByRole('status')).toHaveText('Copied');
	await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
		'<Button variant="primary">Hello</Button>'
	);
});
