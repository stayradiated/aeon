import { Resend } from 'resend'

import { getResendApiKey } from '#lib/server/env.js'

import { once } from '#lib/utils/once.js'

const getResend = once(() => {
  const apiKey = getResendApiKey()
  return new Resend(apiKey)
})

export { getResend }
