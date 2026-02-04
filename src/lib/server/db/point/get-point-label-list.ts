import { errorBoundary } from '@stayradiated/error-boundary'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { RawPointLabel } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetPointLabelListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    labelId?: LabelId
    streamId?: StreamId
  }>
}

const getPointLabelList = async (
  options: GetPointLabelListOptions,
): Promise<RawPointLabel[] | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('pointLabel').selectAll()

    query = extendWhere(query)
      .string('userId', where.userId)
      .string('pointId', where.pointId)
      .string('labelId', where.labelId)
      .string('streamId', where.streamId)
      .done()

    return query.execute()
  })
}

export { getPointLabelList }
