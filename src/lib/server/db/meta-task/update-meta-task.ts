import { errorBoundary } from '@stayradiated/error-boundary'

import type { MetaTaskId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { MetaTask } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type UpdateMetaTaskOptions = {
  db: KyselyDb
  where: Where<{
    metaTaskId: MetaTaskId
    userId: UserId
  }>
  set: Partial<Pick<MetaTask, 'status' | 'lastStartedAt' | 'lastFinishedAt'>>
  now?: number
}

const updateMetaTask = async (
  options: UpdateMetaTaskOptions,
): Promise<MetaTask[] | Error> => {
  const { db, where, set, now = Date.now() } = options

  return errorBoundary(() => {
    let query = db
      .updateTable('metaTask')
      .set({
        status: set.status,
        lastStartedAt: set.lastStartedAt,
        lastFinishedAt: set.lastFinishedAt,
        updatedAt: now,
      })
      .returningAll()

    query = extendWhere(query)
      .string('id', where.metaTaskId)
      .string('userId', where.userId)
      .done()

    return query.execute()
  })
}

export { updateMetaTask }
