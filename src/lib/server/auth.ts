import { sha256 } from '@oslojs/crypto/sha2'
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from '@oslojs/encoding'
import type { RequestEvent } from '@sveltejs/kit'

import type { UserId, UserSessionId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { UserSession } from '#lib/server/types.js'

import { dev as isDev } from '$app/environment'

type SessionValidationResult = { session: UserSession } | { session: undefined }

const SESSION_COOKIE_NAME = 'session'

const generateSessionToken = (): string => {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  const token = encodeBase32LowerCaseNoPadding(bytes)
  return token
}

const createSession = async (
  db: KyselyDb,
  token: string,
  userId: UserId,
): Promise<UserSession> => {
  const sessionId = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token)),
  ) as UserSessionId
  const session = await db
    .insertInto('userSession')
    .values({
      id: sessionId,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
  return session
}

const validateSessionToken = async (
  db: KyselyDb,
  token: string,
): Promise<SessionValidationResult> => {
  const sessionId = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token)),
  ) as UserSessionId
  const session = await db
    .selectFrom('userSession')
    .selectAll('userSession')
    .where('userSession.id', '=', sessionId)
    .executeTakeFirst()

  if (!session) {
    return { session: undefined }
  }

  if (Date.now() >= session.expiresAt) {
    await db
      .deleteFrom('userSession')
      .where('userSession.id', '=', session.id)
      .execute()
    return { session: undefined }
  }
  if (Date.now() >= session.expiresAt - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30
    await db
      .updateTable('userSession')
      .set({ expiresAt: session.expiresAt })
      .where('userSession.id', '=', session.id)
      .execute()
  }
  return { session }
}

const invalidateSession = async (
  db: KyselyDb,
  sessionId: UserSessionId,
): Promise<void> => {
  await db
    .deleteFrom('userSession')
    .where('userSession.id', '=', sessionId)
    .execute()
}

const setSessionTokenCookie = (
  event: RequestEvent,
  token: string,
  expiresAt: number,
): void => {
  event.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(expiresAt),
    path: '/',
    secure: !isDev,
  })
}

const deleteSessionTokenCookie = (event: RequestEvent): void => {
  event.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    secure: !isDev,
  })
}

export {
  SESSION_COOKIE_NAME,
  validateSessionToken,
  invalidateSession,
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
  deleteSessionTokenCookie,
}
