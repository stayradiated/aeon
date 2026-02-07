import { error, fail, redirect } from '@sveltejs/kit'

import type { EmailVerificationId, UserId } from '#lib/ids.js'
import type { Actions, PageServerLoad } from './$types.js'

import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from '#lib/server/auth.js'

import { getDb } from '#lib/server/db/get-db.js'
import { ANY_ID } from '#lib/server/db/where.js'

import { attemptEmailVerification } from '#lib/server/db/email-verification/attempt-email-verification.js'
import { getEmailVerification } from '#lib/server/db/email-verification/get-email-verification.js'
import { getUser } from '#lib/server/db/user/get-user.js'
import { insertUser } from '#lib/server/db/user/insert-user.js'

import { sanitizeCrockfordToken } from '#lib/server/crypto/crockford-token.js'
import { cryptoHash } from '#lib/server/crypto/hash.js'

import { genId } from '#lib/utils/gen-id.js'

const load = (async (event) => {
  const { params } = event

  const emailVerificationId = params.emailVerificationId as EmailVerificationId

  const db = getDb()

  const emailVerification = await getEmailVerification({
    db,
    where: { emailVerificationId },
  })
  if (emailVerification instanceof Error) {
    return error(500, 'Failed to get email verification')
  }
  if (!emailVerification) {
    return error(404, 'Email verification not found')
  }
  if (emailVerification.expiresAt < Date.now()) {
    return error(400, 'Email verification has expired')
  }

  return {
    emailVerificationId,
    email: emailVerification.email,
  }
}) satisfies PageServerLoad

const actions = {
  verify: async (event) => {
    const { request, params } = event

    const formData = await request.formData()
    const token = formData.get('token')

    if (typeof token !== 'string' || token.trim().length === 0) {
      return fail(400, { error: 'Token is required' })
    }

    const db = getDb()

    const emailVerificationId =
      params.emailVerificationId as EmailVerificationId
    const emailVerification = await attemptEmailVerification({
      db,
      where: { emailVerificationId },
    })
    if (emailVerification instanceof Error) {
      return fail(404, { error: 'Too many attempts' })
    }
    if (!emailVerification) {
      return fail(404, { error: 'Email verification not found' })
    }
    if (emailVerification.expiresAt < Date.now()) {
      return fail(400, { error: 'Email verification has expired' })
    }

    const isCorrectToken = await cryptoHash.verify(
      emailVerification.tokenHash,
      sanitizeCrockfordToken(token),
    )
    if (!isCorrectToken) {
      return fail(404, {
        error: `Token is incorrect. You have ${emailVerification.retryCount} attempts remaining.`,
      })
    }

    const existingUser = await getUser({
      db,
      where: { userId: ANY_ID, email: emailVerification.email },
    })
    if (existingUser instanceof Error) {
      return error(500, existingUser)
    }

    let userId: UserId
    if (existingUser) {
      userId = existingUser.id
    } else {
      const user = await insertUser({
        db,
        set: {
          id: genId(),
          email: emailVerification.email,
          stravaClientId: null,
          stravaClientSecret: null,
          stravaSession: null,
        },
      })
      if (user instanceof Error) {
        return error(500, user)
      }
      userId = user.id
    }

    const sessionToken = generateSessionToken()
    const session = await createSession(db, sessionToken, userId)
    setSessionTokenCookie(event, sessionToken, session.expiresAt)
    return redirect(302, '/')
  },
} satisfies Actions

export { load, actions }
