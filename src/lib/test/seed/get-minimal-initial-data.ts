import type { ReadonlyJSONValue } from 'replicache'

import type { AnonUser } from '#lib/core/replicache/types.js'
import type { UserId } from '#lib/ids.js'

type GetMinimalInitialDataOptions = {
  sessionUserId: UserId
}

type GetMinimalInitialDataReturn = Record<string, ReadonlyJSONValue>

/**
 * Get minimal initial data that's required before we can use mutators
 * This includes the workspace and the initial user/person
 */
const getMinimalInitialData = (
  options: GetMinimalInitialDataOptions,
): GetMinimalInitialDataReturn => {
  const { sessionUserId } = options

  return {
    [`user/${sessionUserId}`]: {
      email: 'test@example.com',
    } satisfies AnonUser,
  }
}

export { getMinimalInitialData }
