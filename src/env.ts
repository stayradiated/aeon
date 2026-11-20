import { defineEnvVars } from '@sveltejs/kit/env'
import { z } from 'zod'

export const variables = defineEnvVars({
  PUBLIC_APP_VERSION: {
    public: true,
    static: true,
    schema: z.string().default('v0.0.0'),
  },
  // Optional so builds work without it; validated on first use in #lib/server/env.ts
  DATABASE_URL: { schema: z.string().optional() },
  AEON_API_KEY_SECRET: { schema: z.string().optional() },
  RESEND_API_KEY: { schema: z.string().optional() },
  OPENAI_API_KEY: { schema: z.string().optional() },
})
