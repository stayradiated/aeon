import { errorBoundary } from '@stayradiated/error-boundary'

import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

type UpdateStatusOptions = {
  db: KyselyDb
  where: {
    userId: UserId
  }
  set: {
    enabledAt?: number | null
    prompt?: string
    streamIdList?: StreamId[]

    hash?: string
    status?: string
    emoji?: string
    expiresAt?: number | null
  }
  now?: number
}

const updateStatus = async (
  options: UpdateStatusOptions,
): Promise<void | Error> => {
  const { db, where, set, now = Date.now() } = options

  return errorBoundary(async () => {
    await db
      .updateTable('status')
      .where('userId', '=', where.userId)
      .set({
        ...set,
        updatedAt: now,
      })
      .executeTakeFirstOrThrow()

    return undefined
  })
}

export { updateStatus }
