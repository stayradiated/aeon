import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

import { websocket } from '#lib/server/websocket/vite-middleware.js'

export default defineConfig({
  plugins: [sveltekit(), websocket()],
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
