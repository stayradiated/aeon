import { errorBoundary } from '@stayradiated/error-boundary'

import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Stream } from '#lib/server/types.js'

type UpdateStreamOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    streamId: StreamId
  }
  set: Partial<Pick<Stream, 'name' | 'parentId' | 'sortOrder'>>
  now?: number
}

const updateStream = async (
  options: UpdateStreamOptions,
): Promise<Stream | Error> => {
  const { db, set, now = Date.now() } = options

  return errorBoundary(() =>
    db
      .updateTable('stream')
      .set({
        name: set.name,
        sortOrder: set.sortOrder,
        parentId: set.parentId,
        updatedAt: now,
      })
      .where('id', '=', options.where.streamId)
      .where('userId', '=', options.where.userId)
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { updateStream }
