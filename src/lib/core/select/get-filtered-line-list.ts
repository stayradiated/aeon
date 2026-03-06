import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Line } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLineList } from './get-line-list.js'

const getFilteredLineList = createSelector(
  'getFilteredLineList',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: { gte: number; lte: number }
      durationMs: { gte: number }
    },
    now: number,
  ): Signal<Line[]> => {
    const $lineList = getLineList(store, streamId, {
      startedAt: where.startedAt,
    })

    return computed('getFilteredLineList', () => {
      const lineList = $lineList.value
      return lineList.filter((line) => {
        const durationMs = line.durationMs
          ? line.durationMs
          : now - line.startedAt
        return durationMs >= where.durationMs.gte
      })
    })
  },
)

export { getFilteredLineList }
