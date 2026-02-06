import { z } from 'zod'

import { createEnvGetter } from '#lib/utils/create-env-getter.js'

import { env as privateEnv } from '$env/dynamic/private'

const getDatabaseUrl = createEnvGetter(privateEnv, 'DATABASE_URL', z.url())
const getResendApiKey = createEnvGetter(
  privateEnv,
  'RESEND_API_KEY',
  z.string(),
)

export { getDatabaseUrl, getResendApiKey }
