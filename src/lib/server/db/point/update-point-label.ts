import { errorBoundary } from '@stayradiated/error-boundary'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { RawPointLabel } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type UpdatePointLabelOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    labelId?: LabelId
    streamId?: StreamId
  }>
  set: Partial<
    Pick<RawPointLabel, 'pointId' | 'labelId' | 'streamId' | 'sortOrder'>
  >
  now?: number
}

const updatePointLabel = async (
  options: UpdatePointLabelOptions,
): Promise<RawPointLabel[] | Error> => {
  const { db, where, set, now = Date.now() } = options

  return errorBoundary(() => {
    let query = db
      .updateTable('pointLabel')
      .set({
        pointId: set.pointId,
        labelId: set.labelId,
        streamId: set.streamId,
        sortOrder: set.sortOrder,
        updatedAt: now,
      })
      .returningAll()

    query = extendWhere(query)
      .string('pointId', where.pointId)
      .string('userId', where.userId)
      .string('labelId', where.labelId)
      .string('streamId', where.streamId)
      .done()

    return query.execute()
  })
}

export { updatePointLabel }
