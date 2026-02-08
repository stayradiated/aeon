import { sql } from 'kysely'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Point, RawPoint, RawPointLabel } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'

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

  const value: RawPoint = {
    id: insert.pointId,
    userId: where.userId,
    streamId: where.streamId,
    startedAt: where.startedAt,
    description: set.description,
    createdAt: now,
    updatedAt: now,
  }

  return transact('upsertPoint', db, async ({ db }) => {
    const rawPoint = await db
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
      (labelId): RawPointLabel => ({
        pointId: rawPoint.id,
        labelId,
        streamId: where.streamId,
        userId: where.userId,
        createdAt: now,
        updatedAt: now,
      }),
    )

    if (pointLabelList.length > 0) {
      await db
        .insertInto('pointLabel')
        .values(pointLabelList)
        .onConflict((oc) => oc.columns(['pointId', 'labelId']).doNothing())
        .execute()
    }

    let deletePointLabelQuery = db
      .deleteFrom('pointLabel')
      .where('pointId', '=', rawPoint.id)

    if (labelIdList.length > 0) {
      deletePointLabelQuery = deletePointLabelQuery.where(
        (eb) =>
          sql<boolean>`${eb.ref('labelId')} <> all(${eb.val(labelIdList)})`,
      )
    }

    await deletePointLabelQuery.execute()

    const point: Point = {
      ...rawPoint,
      labelIdList,
    }
    return point
  })
}

export { upsertPoint }
