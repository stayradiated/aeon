import type { Line } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { buildLine } from '#lib/core/shape/build-line.js'

import { createSelector } from '#lib/utils/selector.js'

import { getActivePointList } from './get-active-point-list.js'

/**
 * Converts a stream's ordered points into line intervals for a time window.
 *
 * Each line starts at a point and stops at the next returned point in the same
 * stream. This is the base representation used by logs, calendars, and duration
 * calculations.
 *
 * Quirk: because `getActivePointList` includes boundary context, the first line
 * may start before the requested window and the last line may be open-ended.
 */
const getLineList = createSelector(
  'getLineList',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: { gte: number; lte: number }
    },
  ): Selection<Line[]> => {
    const $pointList = getActivePointList(store, streamId, where)

    return () => {
      const pointList = $pointList.value
      return pointList.map((point, index, list) => {
        const nextPoint = list[index + 1]
        return buildLine({
          points: [point, nextPoint],
        })
      })
    }
  },
)

export { getLineList }
