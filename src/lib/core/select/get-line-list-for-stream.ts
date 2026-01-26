import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Line } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { buildLine } from '#lib/core/shape/build-line.js'

import { clock } from '#lib/utils/clock.js'
import { createSelector } from '#lib/utils/selector.js'

import { getActivePointList } from './get-active-point-list.js'

const getLineListForStream = createSelector(
  'getLineListForStream',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: { gte: number; lte?: number }
    },
  ): Signal<Line[]> => {
    const $pointList = getActivePointList(store, streamId, where)

    return computed('getLineListForStream', () => {
      const pointList = $pointList.value
      return pointList.map((point, index, list) => {
        const nextPoint = list[index + 1]
        return buildLine({
          points: [point, nextPoint],
          now: clock.value,
        })
      })
    })
  },
)

export { getLineListForStream }
