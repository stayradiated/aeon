import { errorBoundary } from '@stayradiated/error-boundary'

import type { PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Point } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type UpdatePointOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    streamId?: StreamId
  }>
  set: Partial<Pick<Point, 'startedAt' | 'description'>>
  now?: number
}

const updatePoint = async (
  options: UpdatePointOptions,
): Promise<void | Error> => {
  const { db, where, set, now = Date.now() } = options

  return errorBoundary(async () => {
    let query = db
      .updateTable('point')
      .set({
        startedAt: set.startedAt,
        description: set.description,
        updatedAt: now,
      })
      .returningAll()

    query = extendWhere(query)
      .string('id', where.pointId)
      .string('userId', where.userId)
      .done()

    await query.execute()
  })
}

export { updatePoint }
