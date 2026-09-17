import { expect, test } from '@playwright/test';

// Placeholder smoke test: verify the app shell loads and the top bar renders.
// Replace with domain-specific flows as features land.
test('smoke: app shell loads', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});
