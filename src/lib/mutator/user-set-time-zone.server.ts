import type { ServerMutator } from './types.ts'

import { getUser } from '#lib/server/db/user/get-user.js'
import { updateUser } from '#lib/server/db/user/update-user.js'

const userSetTimeZone: ServerMutator<'user_setTimeZone'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { timeZone } = options

  const user = await getUser({
    db,
    where: {
      userId: sessionUserId,
    },
  })
  if (user instanceof Error) {
    return user
  }
  if (!user) {
    return new Error('User not found')
  }

  if (user.timeZone === timeZone) {
    // no change
    return
  }

  const result = await updateUser({
    db,
    where: {
      userId: sessionUserId,
    },
    set: {
      timeZone,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default userSetTimeZone
