import type { Signal } from 'signia'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'

import { createSelector } from '#lib/utils/selector'

import { findPointIndex } from './find-point-index.js'
import { getPointList } from './get-point-list.js'

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
  ): Signal<Record<LabelId, number>> => {
    const $pointList = getPointList(store, streamId)

    const $startIndex = findPointIndex(store, streamId, {
      startedAt: { gte: where.startedAt.gte },
    })

    const $endIndex = findPointIndex(store, streamId, {
      startedAt: { lte: where.startedAt.lte },
    })

    return computed('getLabelCountRecord', () => {
      const labelRecord: Record<LabelId, number> = {}

      const startIndex = $startIndex.value
      if (!startIndex) {
        return labelRecord
      }

      const endIndex = $endIndex.value
      if (!endIndex) {
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
    })
  },
)

export { getLabelCountRecord }
