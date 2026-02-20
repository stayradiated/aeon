import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Point } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'

import { bulkInsertLabel } from '#lib/server/db/label/bulk-insert-label.js'
import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { bulkUpsertPoint } from '#lib/server/db/point/bulk-upsert-point.js'
import { getPointList } from '#lib/server/db/point/get-point-list.js'

import { genId } from '#lib/utils/gen-id.js'
import { createIdMap, resolveId } from '#lib/utils/map-and-resolve-id.js'
import { promiseAllRecord } from '#lib/utils/promise-all-record.js'

type MergeStreamsIntoDestinationOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    destinationStreamId: StreamId
    sourceStreamIdList: readonly StreamId[]
  }
  now?: number
}

type Result = {
  insertedLabelCount: number
  upsertedPointCount: number
}

const mergeStreamsIntoDestination = async (
  options: MergeStreamsIntoDestinationOptions,
) => {
  const { db, where, now = Date.now() } = options
  const { destinationStreamId, sourceStreamIdList } = where

  const result: Result = {
    insertedLabelCount: 0,
    upsertedPointCount: 0,
  }

  // ensure that the destination stream ID
  // is different from the source stream IDs
  if (sourceStreamIdList.includes(destinationStreamId)) {
    return new Error('Destination stream cannot be in source list')
  }

  return transact(import.meta.url, db, async ({ db }) => {
    // read all labels in the source streams
    const labelList = await getLabelList({
      db,
      where: {
        userId: where.userId,
        streamId: { in: sourceStreamIdList },
      },
    })
    if (labelList instanceof Error) {
      return labelList
    }

    // insert all these labels into the destination stream
    const bulkInsertLabelResult = await bulkInsertLabel({
      db,
      list: labelList.map((label) => ({
        ...label,
        id: genId(),
        streamId: destinationStreamId,
      })),
      now,
    })
    if (bulkInsertLabelResult instanceof Error) {
      return new Error('Failed to insert labels', {
        cause: bulkInsertLabelResult,
      })
    }

    result.insertedLabelCount = bulkInsertLabelResult.length

    // map the existing label IDs to the new label IDs
    // so when we insert the points, we can use the new label IDs
    const labelIdMap = createIdMap('label', labelList, bulkInsertLabelResult)

    // read all the points
    const pointResult = await promiseAllRecord({
      sourcePointList: getPointList({
        db,
        where: {
          userId: where.userId,
          streamId: { in: sourceStreamIdList },
        },
      }),
      destinationPointList: getPointList({
        db,
        where: {
          userId: where.userId,
          streamId: destinationStreamId,
        },
      }),
    })
    if (pointResult instanceof Error) {
      return pointResult
    }
    const { sourcePointList, destinationPointList } = pointResult

    // for each point in each src stream
    // create a map of startedAt → Point[]
    // so we can merge the points together
    const pointRecord: Record<`${number}`, Point[]> = {}
    for (const sourcePoint of sourcePointList) {
      const array = pointRecord[`${sourcePoint.startedAt}`]
      if (array) {
        array.push(sourcePoint)
      } else {
        pointRecord[`${sourcePoint.startedAt}`] = [sourcePoint]
      }
    }

    // for each point in the destination stream,
    // check if we have a source point with the same startedAt
    for (const point of destinationPointList) {
      const array = pointRecord[`${point.startedAt}`]
      if (array) {
        array.unshift(point)
      }
    }

    // insert all these points into the destination stream
    const bulkUpsertPointResult = await bulkUpsertPoint({
      db,
      list: Object.values(pointRecord).map((pointList) => {
        const startedAt = pointList[0]?.startedAt
        if (!startedAt) {
          throw new Error('No startedAt')
        }

        const description = pointList
          .map((point) => point.description)
          .join(' / ')
        const labelIdList = pointList.flatMap((point) =>
          point.labelIdList.map((originalLabelId) => {
            const labelId = resolveId(labelIdMap, originalLabelId)
            if (labelId instanceof Error) {
              return originalLabelId
            }
            return labelId
          }),
        )

        return {
          where: {
            userId: where.userId,
            streamId: destinationStreamId,
            startedAt,
          },
          insert: {
            pointId: genId(),
          },
          set: {
            description,
            labelIdList,
          },
        }
      }),
      now,
    })
    if (bulkUpsertPointResult instanceof Error) {
      return new Error('Failed to insert points', {
        cause: bulkUpsertPointResult,
      })
    }

    result.upsertedPointCount = bulkUpsertPointResult.length

    return result
  })
}

export { mergeStreamsIntoDestination }
