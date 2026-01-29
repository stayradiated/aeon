import { z } from 'zod'

import { createEnvGetter } from '#lib/utils/create-env-getter.js'

import { env as privateEnv } from '$env/dynamic/private'

const getOrigin = createEnvGetter(privateEnv, 'ORIGIN', z.string())
const getDatabaseUrl = createEnvGetter(privateEnv, 'DATABASE_URL', z.url())
const getResendApiKey = createEnvGetter(
  privateEnv,
  'RESEND_API_KEY',
  z.string(),
)

export { getOrigin, getDatabaseUrl, getResendApiKey }
