import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

// Vite exposes only VITE_* to the client and never puts dotenv values into
// the server's process.env, but server code reads process.env directly.
// Fill missing keys from the dotenv files (`loadEnv` handles .env,
// .env.local, .env.[mode], .env.[mode].local precedence) for `vite dev`
// only; real environment always wins.
function loadDevEnv(mode: string) {
  const fileValues = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(fileValues)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export default defineConfig(async ({ command, mode }) => {
  if (command === "serve" && mode === "development") {
    loadDevEnv(mode);
  }

  return {
    plugins: [sveltekit(), tailwindcss()],
    // Vitest runs the SSR transform pipeline, so `svelte` resolves to its
    // server entry and component mounting is unavailable. Scope the browser
    // export conditions to vitest only (Svelte's testing guidance); dev/build
    // keep the framework's own resolution.
    resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
    server: {
      watch: {
        ignored: [
          "**/.vercel/**",
          "**/.data/**",
          "**/.tmp/**",
          "**/.svelte-kit/**",
          "**/coverage/**",
          "**/.git/**",
        ],
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      include: ["src/**/*.{test,spec}.{js,ts}", "scripts/**/*.test.mjs"],
    },
  };
});
