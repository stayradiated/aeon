import type { LabelId, StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { findPointIndex } from './find-point-index.js'
import { getPointList } from './get-point-list.js'

/**
 * Counts how many points used each label within a stream and started-at range.
 *
 * Use this for popularity ordering and simple event counts. The result is keyed
 * by label id and counts point occurrences, not total duration.
 */
const getLabelCountRecord = createSelector(
  'getLabelCountRecord',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: {
        gte: number
        lte: number
      }
    },
  ): Selection<Record<LabelId, number>> => {
    const $pointList = getPointList(store, streamId)

    const $startIndex = findPointIndex(store, streamId, {
      startedAt: { gte: where.startedAt.gte },
    })

    const $endIndex = findPointIndex(store, streamId, {
      startedAt: { lte: where.startedAt.lte },
    })

    return () => {
      const labelRecord: Record<LabelId, number> = {}

      const startIndex = $startIndex.value
      if (typeof startIndex === 'undefined') {
        return labelRecord
      }

      const endIndex = $endIndex.value
      if (typeof endIndex === 'undefined') {
        return labelRecord
      }

      const pointList = $pointList.value
      const pointSlice = pointList.slice(startIndex, endIndex + 1)

      for (const point of pointSlice) {
        for (const labelId of point.labelIdList) {
          labelRecord[labelId] ??= 0
          labelRecord[labelId] += 1
        }
      }

      return labelRecord
    }
  },
)

export { getLabelCountRecord }
