import { errorBoundary } from '@stayradiated/error-boundary'

import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { User } from '#lib/server/types.js'

type UpdateUserOptions = {
  db: KyselyDb
  where: {
    userId: UserId
  }
  set: Partial<Pick<User, 'timeZone'>>
  now?: number
}

const updateUser = async (
  options: UpdateUserOptions,
): Promise<void | Error> => {
  const { db, set, now = Date.now() } = options

  return errorBoundary(async () => {
    await db
      .updateTable('user')
      .set({
        timeZone: set.timeZone,
        updatedAt: now,
      })
      .where('id', '=', options.where.userId)
      .execute()
  })
}

export { updateUser }
