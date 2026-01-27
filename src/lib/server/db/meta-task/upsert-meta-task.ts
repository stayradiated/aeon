import { errorBoundary } from '@stayradiated/error-boundary'

import type { MetaTaskId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { MetaTask } from '#lib/server/types.js'

type UpsertMetaTaskOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    name: string
  }
  insert: {
    metaTaskId: MetaTaskId
  }
  set: {
    status: string
    lastStartedAt: number
    lastFinishedAt: number | null
  }
  now?: number
}

const upsertMetaTask = async (
  options: UpsertMetaTaskOptions,
): Promise<MetaTask | Error> => {
  const { db, where, insert, set, now = Date.now() } = options

  const value: MetaTask = {
    id: insert.metaTaskId,
    userId: where.userId,
    name: where.name,
    status: set.status,
    lastStartedAt: set.lastStartedAt,
    lastFinishedAt: set.lastFinishedAt,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('metaTask')
      .values(value)
      .onConflict((ocb) =>
        ocb.columns(['userId', 'name']).doUpdateSet({
          ...set,
          updatedAt: now,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertMetaTask }
