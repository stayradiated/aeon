import { errorBoundary } from '@stayradiated/error-boundary'

import type { PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { PointWithLabelList } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetPointListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    streamId?: StreamId
    startedAt?: number
  }>
  paginate?: {
    pointer: { startedAt: number; id: PointId } | undefined
    limit: number
  }
}

const getPointList = async (
  options: GetPointListOptions,
): Promise<PointWithLabelList[] | Error> => {
  const { db, where, paginate } = options

  return errorBoundary(() => {
    let query = db.selectFrom('pointWithLabelList').selectAll()

    query = extendWhere(query)
      .string('id', where.pointId)
      .string('userId', where.userId)
      .string('streamId', where.streamId)
      .number('startedAt', where.startedAt)
      .done()

    if (paginate) {
      query = query
        .orderBy('startedAt', 'asc')
        .orderBy('id', 'asc')
        .limit(paginate.limit)

      if (paginate.pointer) {
        const pointerStartedAt = paginate.pointer.startedAt
        const pointerId = paginate.pointer.id
        query = query.where((eb) =>
          eb(
            eb.refTuple('startedAt', 'id'),
            '>',
            eb.tuple(pointerStartedAt, pointerId),
          ),
        )
      }
    }

    return query.execute()
  })
}

export { getPointList }
