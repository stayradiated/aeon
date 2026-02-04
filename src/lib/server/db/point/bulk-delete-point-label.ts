import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'

import { transact } from '#lib/server/db/transact.js'
import { extendWhere } from '#lib/server/db/where.js'

type BulkDeletePointLabelOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    labelId?: LabelId
    pointId?: PointId
    streamId?: StreamId
  }>
  now?: number
}

const bulkDeletePointLabel = async (
  options: BulkDeletePointLabelOptions,
): Promise<void | Error> => {
  const { db, where, now = Date.now() } = options

  return transact('bulkDeletePointLabels', db, async ({ db }) => {
    let query = db.deleteFrom('pointLabel').returning('pointId')

    query = extendWhere(query)
      .string('labelId', where.labelId)
      .string('pointId', where.pointId)
      .string('streamId', where.streamId)
      .string('userId', where.userId)
      .done()

    const deletedRowList = await query.execute()

    // bump all points that were updated
    // critical for replicache CVR to detect changes
    const pointIdSet = new Set(deletedRowList.map((row) => row.pointId))
    if (pointIdSet.size > 0) {
      await db
        .updateTable('point')
        .set({
          updatedAt: now,
        })
        .where('id', 'in', Array.from(pointIdSet))
        .execute()
    }
  })
}

export { bulkDeletePointLabel }
