import { redirect } from '@sveltejs/kit'

import { building as isBuilding } from '$app/environment'

import { onInit } from './hooks.server.init.js'

if (!isBuilding) {
  await onInit()
}

import type { Handle } from '@sveltejs/kit'

import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
  validateSessionToken,
} from '$lib/server/auth.js'
import { getDb } from '$lib/server/db/get-db'

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session')
  if (token) {
    const db = getDb()
    const { session } = await validateSessionToken(db, token)
    if (session) {
      setSessionTokenCookie(event, token, session.expiresAt)
    } else {
      deleteSessionTokenCookie(event)
    }
    event.locals.session = session
  } else {
    event.locals.session = undefined
  }

  // do not require a cookie session when querying these exact paths
  if (
    event.route.id === '/login' ||
    event.route.id === '/login/verify/[emailVerificationId]'
  ) {
    return resolve(event)
  }

  // user must be authenticated at this point
  if (!event.locals.session) {
    return redirect(302, '/login')
  }

  return resolve(event)
}
