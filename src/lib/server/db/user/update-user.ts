import { errorBoundary } from '@stayradiated/error-boundary'

import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

type UpdateUserOptions = {
  db: KyselyDb
  where: {
    userId: UserId
  }
  set: {
    slackToken?: string | null
  }
  now?: number
}

const updateUser = async (
  options: UpdateUserOptions,
): Promise<void | Error> => {
  const { db, where, set, now = Date.now() } = options

  return errorBoundary(async () => {
    await db
      .updateTable('user')
      .where('id', '=', where.userId)
      .set({
        ...set,
        updatedAt: now,
      })
      .executeTakeFirstOrThrow()
  })
}

export { updateUser }
