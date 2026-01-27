import { errorBoundary } from '@stayradiated/error-boundary'

import type { ReplicacheClientViewId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { CVR } from '#lib/server/replicache/cvr.js'
import type { ReplicacheClientView } from '#lib/server/types.js'

type InsertReplicacheClientViewOptions = {
  db: KyselyDb
  where: {
    replicacheClientViewId: ReplicacheClientViewId
  }
  set: {
    record: CVR
    version: string
  }
  now?: number
}

const insertReplicacheClientView = async (
  options: InsertReplicacheClientViewOptions,
): Promise<void | Error> => {
  const { db, where, set, now = Date.now() } = options

  const value: ReplicacheClientView = {
    id: where.replicacheClientViewId,
    record: set.record,
    version: set.version,
    createdAt: now,
  }

  const result = await errorBoundary(() =>
    db.insertInto('replicacheClientView').values(value).execute(),
  )
  if (result instanceof Error) {
    return result
  }
}

export { insertReplicacheClientView }
