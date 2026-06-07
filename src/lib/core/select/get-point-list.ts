import type { StreamId } from '#lib/ids.js'

import { createSelector } from '#lib/utils/selector.js'

/**
 * Returns all points that belong to a stream, sorted by `startedAt` ascending.
 *
 * Use this as the base selector for active-point lookup, line construction, and
 * any stream-local point queries.
 */
const getPointList = createSelector(
  'getPointList',
  (store, streamId: StreamId) => {
    const $filteredPointList = store.point.filter(
      `streamId:${streamId}`,
      (value) => {
        return value.streamId === streamId
      },
    )

    return () => {
      return $filteredPointList.value.toSorted((a, b) => {
        return a.startedAt - b.startedAt
      })
    }
  },
)

export { getPointList }
