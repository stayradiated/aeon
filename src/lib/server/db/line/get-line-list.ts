import { errorBoundary } from '@stayradiated/error-boundary'

import type { PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Line } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetLineListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    streamId?: StreamId
    startedAt?: number
    stoppedAt?: number
  }>
}

const getLineList = async (
  options: GetLineListOptions,
): Promise<Line[] | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('line').selectAll()

    query = extendWhere(query)
      .string('pointId', where.pointId)
      .string('userId', where.userId)
      .string('streamId', where.streamId)
      .number('startedAt', where.startedAt)
      .number('stoppedAt', where.stoppedAt)
      .done()

    return query.execute()
  })
}

export { getLineList }
