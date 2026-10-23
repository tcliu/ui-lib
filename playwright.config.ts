import { cpus } from 'node:os'
import { defineConfig } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL
if (!baseURL) {
  throw new Error('e2e: E2E_BASE_URL is unset — run via `npm run e2e` so the dev port is resolved first')
}

export default defineConfig({
  testDir: './tests',
  outputDir: './.tmp/e2e/artifacts',
  globalTeardown: './tests/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.E2E_WORKERS
    ? Number(process.env.E2E_WORKERS)
    : Math.min(8, Math.max(1, Math.floor(cpus().length / 2))),
  reporter: [['list']],
  use: {
    baseURL,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
})
