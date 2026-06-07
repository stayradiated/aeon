import type { StreamId } from '#lib/ids.js'
import type { Point } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { findPointIndex } from './find-point-index.js'
import { getPointList } from './get-point-list.js'

const getActivePointList = createSelector(
  'getActivePointList',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: { gte?: number; lte?: number }
    },
  ): Selection<Point[]> => {
    const $pointList = getPointList(store, streamId)

    if (
      where.startedAt.gte === undefined &&
      where.startedAt.lte === undefined
    ) {
      console.warn(
        'getActivePointList: where.startedAt is undefined, returning full point list',
      )
      return $pointList
    }

    const $startIndex =
      typeof where.startedAt.gte === 'number'
        ? findPointIndex(store, streamId, {
            startedAt: { lte: where.startedAt.gte },
          })
        : undefined

    const $endIndex =
      typeof where.startedAt.lte === 'number'
        ? findPointIndex(store, streamId, {
            startedAt: { gte: where.startedAt.lte },
          })
        : undefined

    return () => {
      const startIndex = $startIndex?.value ?? 0
      const endIndex = $endIndex?.value
      return $pointList.value.slice(
        startIndex,
        typeof endIndex === 'number' ? endIndex + 1 : undefined,
      )
    }
  },
)

export { getActivePointList }
