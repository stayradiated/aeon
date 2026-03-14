import { z } from 'zod'

import { createEnvGetter } from '#lib/utils/create-env-getter.js'

import { env as privateEnv } from '$env/dynamic/private'

const getDatabaseUrl = createEnvGetter(privateEnv, 'DATABASE_URL', z.url())

const getAeonApiKeySecret = createEnvGetter(
  privateEnv,
  'AEON_API_KEY_SECRET',
  z.string(),
)

const getResendApiKey = createEnvGetter(
  privateEnv,
  'RESEND_API_KEY',
  z.string(),
)

const getOpenAIApiKey = createEnvGetter(
  privateEnv,
  'OPENAI_API_KEY',
  z.string(),
)

export { getAeonApiKeySecret, getDatabaseUrl, getOpenAIApiKey, getResendApiKey }
