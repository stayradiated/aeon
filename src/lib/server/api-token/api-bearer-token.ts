import type { UserId } from '#lib/ids.js'

const API_TOKEN_LENGTH = 32
const AUTH_TOKEN_SEPARATOR = '.'
const AUTH_TOKEN_PREFIX_V1 = 'aeon'
type ApiBearerToken =
  | {
      version: 0
      userId: UserId
      value: string
    }
  | {
      version: 1
      userId: UserId
      value: string
    }
/*
 * generate a secure random API token
 * this must be browser compatible, as we generate the token locally
 */
const genApiBearerToken = (userId: UserId): ApiBearerToken => {
  // Create an array with cryptographically secure random values
  const tokenBytes = new Uint8Array(API_TOKEN_LENGTH)
  crypto.getRandomValues(tokenBytes)
  const value = Buffer.from(tokenBytes).toString('base64url')
  return {
    version: 1,
    userId,
    value,
  }
}
const marshalApiBearerToken = (authToken: ApiBearerToken): string | Error => {
  const { version } = authToken
  switch (version) {
    case 0: {
      return [authToken.userId, authToken.value].join(AUTH_TOKEN_SEPARATOR)
    }
    case 1: {
      return [AUTH_TOKEN_PREFIX_V1, authToken.userId, authToken.value].join(
        AUTH_TOKEN_SEPARATOR,
      )
    }
    default: {
      version satisfies never
      return new Error(`Unknown ApiBearerToken version: '${version}'`)
    }
  }
}
const unmarshalApiBearerToken = (input: string): ApiBearerToken | Error => {
  const parts = input.split(AUTH_TOKEN_SEPARATOR)
  const prefix = parts.at(0)
  if (prefix === AUTH_TOKEN_PREFIX_V1) {
    if (parts.length !== 3) {
      return new Error('Invalid ApiBearerToken')
    }
    const userId = parts.at(1)
    if (!userId || userId.trim().length === 0) {
      return new Error('Invalid ApiBearerToken (invalid userId)')
    }
    const value = parts.at(2)
    if (!value || value.trim().length === 0) {
      return new Error('Invalid ApiBearerToken (invalid value)')
    }
    return {
      version: 1,
      userId: userId as UserId,
      value,
    }
  }
  if (parts.length !== 2) {
    return new Error('Invalid ApiBearerToken')
  }
  const userId = prefix
  if (!userId || userId.trim().length === 0) {
    return new Error('Invalid ApiBearerToken (invalid userId)')
  }
  const value = parts.at(1)
  if (!value || value.trim().length === 0) {
    return new Error('Invalid ApiBearerToken (invalid value)')
  }
  return {
    version: 0,
    userId: userId as UserId,
    value,
  }
}

export type { ApiBearerToken }

export { genApiBearerToken, marshalApiBearerToken, unmarshalApiBearerToken }
