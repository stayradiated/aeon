import { errorBoundary } from '@stayradiated/error-boundary'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Point, PointLabel } from '#lib/server/types.js'

type UpsertPointOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    streamId: StreamId
    startedAt: number
  }
  insert: {
    pointId: PointId
  }
  set: {
    description: string
    labelIdList: readonly LabelId[]
  }
  now?: number
}

const upsertPoint = async (
  options: UpsertPointOptions,
): Promise<Point | Error> => {
  const { db, where, insert, set, now = Date.now() } = options

  const value: Point = {
    id: insert.pointId,
    userId: where.userId,
    streamId: where.streamId,
    startedAt: where.startedAt,
    description: set.description,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(async () => {
    const point = await db
      .insertInto('point')
      .values(value)
      .onConflict((oc) =>
        oc.columns(['streamId', 'startedAt']).doUpdateSet({
          description: set.description,
          updatedAt: now,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow()

    // remove duplicate labels, while preserving order
    const labelIdList = [...new Set(set.labelIdList)]

    const pointLabelList = labelIdList.map(
      (labelId, index): PointLabel => ({
        pointId: point.id,
        labelId,
        streamId: where.streamId,
        userId: where.userId,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      }),
    )

    // TODO: make this a single query
    // TODO: don't delete all pointLabels, just the ones that are being deleted

    await db.deleteFrom('pointLabel').where('pointId', '=', point.id).execute()
    if (pointLabelList.length > 0) {
      await db.insertInto('pointLabel').values(pointLabelList).execute()
    }

    return point
  })
}

export { upsertPoint }
