import type { StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { lowerBound, upperBound } from '#lib/utils/binary-search.js'
import { createSelector } from '#lib/utils/selector.js'

import { getPointList } from './get-point-list.js'

const findPointIndex = createSelector(
  'findPointIndex',
  (
    store,
    streamId: StreamId,
    where: { startedAt: { lte: number } | { gte: number } },
  ): Selection<number | undefined> => {
    const $list = getPointList(store, streamId)

    return () => {
      const list = $list.value

      if (list.length === 0) {
        return undefined
      }

      if ('lte' in where.startedAt) {
        const target = where.startedAt.lte
        const index = upperBound(list, (point) => point.startedAt - target) - 1
        return index >= 0 ? index : undefined
      }
      const target = where.startedAt.gte
      const index = lowerBound(list, (point) => point.startedAt - target)
      return index < list.length ? index : undefined
    }
  },
)

export { findPointIndex }
