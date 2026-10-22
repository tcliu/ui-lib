import path from 'node:path'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

// Vite exposes only VITE_* to the client and never puts dotenv values into
// the server's process.env, but server code reads process.env directly.
// Fill missing keys from the dotenv files (`loadEnv` handles .env,
// .env.local, .env.[mode], .env.[mode].local precedence) for `vite dev`
// only; real environment always wins.
function loadDevEnv(mode: string) {
  const fileValues = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(fileValues)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

// Ignore only this checkout's worktrees root (sibling checkouts when running
// in the default worktree). Anchored to process.cwd() so `vite dev` inside a
// worktree keeps watching its own files: a `**/.worktrees/**` glob tests the
// whole absolute path and would match every file when the root itself lives
// under the worktrees root. `loadDevEnv` has loaded `.env.local` before the
// watcher calls this, so a relocatable WORKTREES_DIR is honored too.
function isWorktreesPath(id: string) {
  const configured = process.env.WORKTREES_DIR?.trim()
  const root = configured
    ? path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured)
    : path.join(process.cwd(), '.worktrees')
  const prefix = root + path.sep
  const abs = path.isAbsolute(id) ? id : path.join(process.cwd(), id)
  return abs.startsWith(prefix)
}

export default defineConfig(async ({ command, mode }) => {
  if (command === 'serve' && mode === 'development') {
    loadDevEnv(mode)
  }

  return {
    plugins: [sveltekit(), tailwindcss()],
    // Vitest runs the SSR transform pipeline, so `svelte` resolves to its
    // server entry and component mounting is unavailable. Scope the browser
    // export conditions to vitest only (Svelte's testing guidance); dev/build
    // keep the framework's own resolution.
    resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
    server: {
      watch: {
        ignored: [
          '**/.vercel/**',
          '**/.data/**',
          '**/.tmp/**',
          '**/.svelte-kit/**',
          '**/coverage/**',
          '**/.git/**',
          isWorktreesPath,
        ],
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      // A unit test sits beside the module it exercises, so the suite is
      // collected by name wherever it lives; `tests/` belongs to Playwright.
      include: ['src/**/*.test.{js,ts,mjs}', 'scripts/**/*.test.{js,ts,mjs}'],
    },
  }
})
