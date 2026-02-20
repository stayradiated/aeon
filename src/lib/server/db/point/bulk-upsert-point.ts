import { sql } from 'kysely'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Point, RawPoint, RawPointLabel } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'

import { createIdMap, mustResolveId } from '#lib/utils/map-and-resolve-id.js'

type UpsertPointOptions = {
  db: KyselyDb
  list: {
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
  }[]
  now?: number
}

type UniqueKey = `${StreamId}:${number}`

const bulkUpsertPoint = async (
  options: UpsertPointOptions,
): Promise<Point[] | Error> => {
  const { db, list, now = Date.now() } = options

  if (list.length === 0) {
    return []
  }

  // assert no duplicate keys trying to be upserted
  // (would cause the INSERT to fail)
  const conflictKeySet = new Set<UniqueKey>()

  // a list of all the points and pointLabels that will be inserted
  const rawPointList: RawPoint[] = []
  const rawPointLabelList: RawPointLabel[] = []

  for (const item of list) {
    const { where, insert, set } = item

    const key: UniqueKey = `${where.streamId}:${where.startedAt}`
    if (conflictKeySet.has(key)) {
      return new Error(
        `bulkUpsertPoint: duplicate conflict key (streamId, startedAt)=(${where.streamId}, ${where.startedAt})`,
      )
    }
    conflictKeySet.add(key)

    rawPointList.push({
      id: insert.pointId,
      userId: where.userId,
      streamId: where.streamId,
      startedAt: where.startedAt,
      description: set.description,
      createdAt: now,
      updatedAt: now,
    })

    // remove duplicate labels, while preserving order
    const labelIdList = [...new Set(set.labelIdList)]

    for (const labelId of labelIdList) {
      rawPointLabelList.push({
        pointId: insert.pointId, // NOTE: must be replaced with the ID from the upsert
        labelId,
        streamId: where.streamId,
        userId: where.userId,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  return transact('upsertPoint', db, async ({ db }) => {
    const upsertedRawPointList = await db
      .insertInto('point')
      .values(rawPointList)
      .onConflict((oc) =>
        oc.columns(['streamId', 'startedAt']).doUpdateSet((eb) => ({
          description: eb.ref('excluded.description'),
          updatedAt: now,
        })),
      )
      .returningAll()
      .execute()

    // map from the original point IDs to the inserted point ID As the point
    // with the same stream/startedAt may have already existed, in which case
    // we want to use the existing ID.
    const pointIdMap = createIdMap('point', rawPointList, upsertedRawPointList)

    for (const rawPointLabel of rawPointLabelList) {
      // replace the point ID with the upserted ID
      rawPointLabel.pointId = mustResolveId(pointIdMap, rawPointLabel.pointId)
    }

    const upsertedPointIdList = upsertedRawPointList.map((row) => row.id)
    const pointLabelPairList: Array<[PointId, LabelId]> = rawPointLabelList.map(
      (row) => [row.pointId, row.labelId],
    )

    if (rawPointLabelList.length > 0) {
      await db
        .insertInto('pointLabel')
        .values(rawPointLabelList)
        .onConflict((oc) => oc.columns(['pointId', 'labelId']).doNothing())
        .execute()
    }

    // delete any pointLabels for the upserted points
    // that are not in the new list
    let deletePointLabelQuery = db
      .deleteFrom('pointLabel')
      .where((eb) => eb('pointId', '=', eb.fn.any(eb.val(upsertedPointIdList))))
    if (pointLabelPairList.length > 0) {
      deletePointLabelQuery = deletePointLabelQuery.where((eb) =>
        eb(
          eb.refTuple('pointId', 'labelId'),
          'not in',
          sql<[PointId, LabelId]>`(values ${sql.join(
            pointLabelPairList.map((pair) => sql`(${pair[0]}, ${pair[1]})`),
            sql`, `,
          )})`,
        ),
      )
    }
    await deletePointLabelQuery.execute()

    // construct the upserted point list
    const upsertedPointList = upsertedRawPointList.map(
      (pointRow): Point => ({
        ...pointRow,
        labelIdList: rawPointLabelList.flatMap((pointLabelRow) =>
          pointLabelRow.pointId === pointRow.id ? pointLabelRow.labelId : [],
        ),
      }),
    )

    return upsertedPointList
  })
}

export { bulkUpsertPoint }
