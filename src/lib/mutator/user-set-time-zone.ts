import type { AnonUser } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const userSetTimeZone: LocalMutator<'user_setTimeZone'> = async (
  context,
  options,
) => {
  const { tx, sessionUserId } = context
  const { timeZone } = options

  const userKey = Key.user.encode(sessionUserId)
  const user = await tx.get<AnonUser>(userKey)
  if (!user) {
    return new Error('User not found')
  }

  if (user.timeZone === timeZone) {
    // no change
    return
  }

  const value: AnonUser = {
    ...user,
    timeZone,
  }
  await tx.set(userKey, value)
}

export default userSetTimeZone
