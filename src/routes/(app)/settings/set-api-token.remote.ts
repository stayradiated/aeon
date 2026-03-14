import { error } from '@sveltejs/kit'

import { command, getRequestEvent } from '$app/server'

import { getAeonApiKeySecret } from '#lib/server/env.js'

import { getDb } from '#lib/server/db/get-db.js'

import { updateUser } from '#lib/server/db/user/update-user.js'

import {
  genApiBearerToken,
  marshalApiBearerToken,
} from '#lib/server/api-token/api-bearer-token.js'
import { hashToken } from '#lib/server/api-token/hash-token.js'

const setApiToken = command(async () => {
  const { locals } = getRequestEvent()

  const sessionUserId = locals.session?.userId
  if (!sessionUserId) {
    throw error(402, 'Must be logged in')
  }

  const db = getDb()

  const apiBearerToken = genApiBearerToken(sessionUserId)
  const token = marshalApiBearerToken(apiBearerToken)
  if (token instanceof Error) {
    return error(500, token)
  }

  await updateUser({
    db,
    where: {
      userId: sessionUserId,
    },
    set: {
      apiTokenHash: hashToken({ secret: getAeonApiKeySecret(), token }),
    },
  })

  return token
})

export { setApiToken }
