import { errorBoundary } from '@stayradiated/error-boundary'

import type { ReplicacheClientViewId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { ReplicacheClientView } from '#lib/server/types.js'

type GetReplicacheClientViewOptions = {
  db: KyselyDb
  where: {
    replicacheClientViewId: ReplicacheClientViewId
    version: string
  }
}

const getReplicacheClientView = async (
  options: GetReplicacheClientViewOptions,
): Promise<ReplicacheClientView | undefined | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .selectFrom('replicacheClientView')
      .selectAll()
      .where('id', '=', where.replicacheClientViewId)
      .where('version', '=', where.version)
      .executeTakeFirst(),
  )
}

export { getReplicacheClientView }
