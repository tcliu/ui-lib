import { expect, test } from '@playwright/test';
import { SHOWCASE_COMPONENTS } from '../src/lib/showcase-components';

// Controls rendered inside the demo region (the `main` element), so a route
// that only renders its shared chrome fails instead of passing vacuously.
const DEMO_CONTROLS =
	'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="tab"]';

// The Spinner demo is purely presentational and renders no interactive
// control of its own, so it asserts the SVG it renders instead.
const PRESENTATIONAL_SLUGS = new Set(['spinner']);

test('showcase: index renders the component index', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'BaseDialog' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'SelectDropdown' })).toBeVisible();
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
