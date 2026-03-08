import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Line } from '#lib/core/shape/types.js'
import type { LabelId, StreamId } from '#lib/ids.js'

import { calcDuration } from '#lib/core/shape/calc-duration'

import { createSelector } from '#lib/utils/selector.js'

import { getLineList } from './get-line-list.js'

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
  ): Signal<Line[]> => {
    const $lineList = getLineList(store, streamId, {
      startedAt: where.startedAt,
    })

    return computed('getFilteredLineList', () => {
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
    })
  },
)

export { getFilteredLineList }
