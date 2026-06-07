import type { Line } from '#lib/core/shape/types.js'
import type { LabelId, StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { calcDuration } from '#lib/core/shape/calc-duration'

import { createSelector } from '#lib/utils/selector.js'

import { getLineList } from './get-line-list.js'

/**
 * Returns a stream's line intervals filtered by duration and/or label.
 *
 * Use this as the shared base for calendar and duration selectors. The time
 * window is resolved by `getLineList`, while optional filters remove short lines
 * or lines that do not include the requested label.
 *
 * Quirk: open-ended line durations are calculated against `now`.
 */
const getFilteredLineList = createSelector(
  'getFilteredLineList',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: { gte: number; lte: number }
      durationMs?: { gte: number }
      labelId?: LabelId
    },
    now: number,
  ): Selection<Line[]> => {
    const $lineList = getLineList(store, streamId, {
      startedAt: where.startedAt,
    })

    return () => {
      const lineList = $lineList.value
      return lineList.filter((line) => {
        if (where.durationMs) {
          const durationMs = calcDuration(line, now)
          if (durationMs < where.durationMs.gte) {
            return false
          }
        }

        if (where.labelId) {
          const hasLabel = line.labelIdList.includes(where.labelId)
          if (!hasLabel) {
            return false
          }
        }

        return true
      })
    }
  },
)

export { getFilteredLineList }
