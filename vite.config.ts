import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

import { websocket } from './src/lib/server/websocket/vite-middleware.ts'

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
