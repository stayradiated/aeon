import adapter from '@sveltejs/adapter-node'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

import { websocket } from './src/lib/server/websocket/vite-middleware.ts'

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      preprocess: vitePreprocess(),
      serviceWorker: {
        // Registered manually in src/register-service-worker.ts.
        register: false,
      },
      experimental: {
        remoteFunctions: true,
      },
    }),
    websocket(),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    sequence: {
      concurrent: true,
    },
    maxConcurrency: 10,
    coverage: {
      reporter: ['html', 'text', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
})
