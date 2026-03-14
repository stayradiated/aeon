import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

import { getAeonApiKeySecret } from '#lib/server/env.js'

import { getUser } from '#lib/server/db/user/get-user.js'

import { unmarshalApiBearerToken } from './api-bearer-token.js'
import { verifyTokenWithHash } from './hash-token.js'

class AuthenticationError extends Error {}

type ApiSession = {
  sessionUserId: UserId
}

type GetApiSessionOptions = {
  db: KyselyDb
  request: Request
}

const getApiSession = async (
  options: GetApiSessionOptions,
): Promise<ApiSession | AuthenticationError | Error> => {
  const { db, request } = options

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return new AuthenticationError('Missing Authorization Header')
  }

  const authToken = authHeader.match(/^Bearer (.+)$/i)?.at(1)
  if (!authToken) {
    return new AuthenticationError('Invalid Authorization Token')
  }

  const apiBearerToken = unmarshalApiBearerToken(authToken)
  if (apiBearerToken instanceof Error) {
    return new AuthenticationError('Invalid Authorization Token', {
      cause: apiBearerToken,
    })
  }

  const { userId } = apiBearerToken

  const user = await getUser({ db, where: { userId } })
  if (user instanceof Error) {
    return new AuthenticationError('Invalid Authorization Token', {
      cause: user,
    })
  }
  if (!user) {
    return new AuthenticationError('Invalid Authorization Token', {
      cause: new Error(`Could not find user with ID: ${userId}`),
    })
  }
  if (!user.apiTokenHash) {
    return new AuthenticationError('Invalid Authorization Token', {
      cause: new Error(`User ${userId} does not have an api token hash`),
    })
  }

  if (
    !verifyTokenWithHash({
      secret: getAeonApiKeySecret(),
      token: authToken,
      hash: user.apiTokenHash,
    })
  ) {
    return new AuthenticationError('Invalid Authorization Token')
  }

  return {
    sessionUserId: user.id,
  }
}

export { AuthenticationError, getApiSession }
