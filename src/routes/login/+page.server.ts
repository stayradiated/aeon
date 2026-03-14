import { error, redirect } from '@sveltejs/kit'
import * as dateFns from 'date-fns'

import type { Actions, PageServerLoad } from './$types.js'

import { getDb } from '#lib/server/db/get-db.js'

import { checkEmailIsRateLimited } from '#lib/server/db/email-verification/check-rate-limited-email.js'
import { insertEmailVerification } from '#lib/server/db/email-verification/insert-email-verification.js'

import { genCrockfordToken } from '#lib/server/crypto/crockford-token.js'
import { genSecureToken } from '#lib/server/crypto/gen-secure-token.js'
import { cryptoHash } from '#lib/server/crypto/hash.js'
import { sendVerificationEmail } from '#lib/server/email/send-verification-email.js'

const load = (async (event) => {
  const { locals } = event

  return {
    sessionUserId: locals.session?.userId,
  }
}) satisfies PageServerLoad

const actions = {
  login: async (event) => {
    const { request } = event
    const formData = await request.formData()
    const email = formData.get('email')

    if (typeof email !== 'string' || email.trim().length === 0) {
      return error(400, 'Email is required')
    }

    const db = getDb()

    const isRateLimited = await checkEmailIsRateLimited({
      db,
      where: { email },
    })
    if (isRateLimited instanceof Error) {
      return error(500, isRateLimited)
    }
    if (isRateLimited) {
      return error(
        400,
        'Please wait a few seconds before trying to login again.',
      )
    }

    const verificationToken = genCrockfordToken()
    const tokenHash = await cryptoHash.hash(verificationToken.value)

    const emailVerification = await insertEmailVerification({
      db,
      set: {
        id: genSecureToken(32),
        email,
        tokenHash,
        expiresAt: dateFns.addMinutes(Date.now(), 15).getTime(),
        retryCount: 3,
      },
    })
    if (emailVerification instanceof Error) {
      throw emailVerification
    }

    const emailResult = await sendVerificationEmail({
      userEmail: email,
      verificationCode: verificationToken.prettified,
    })
    if (emailResult instanceof Error) {
      throw emailResult
    }

    return redirect(302, `/login/verify/${emailVerification.id}`)
  },
} satisfies Actions

export { actions, load }
