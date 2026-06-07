import type { StreamId } from '#lib/ids.js'
import type { Point } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { findPointIndex } from './find-point-index.js'
import { getPointList } from './get-point-list.js'

/**
 * Returns the point that is active for a stream at a timestamp.
 *
 * A point is considered active from its `startedAt` until the next point in the
 * same stream starts, so this returns the latest point at or before the
 * timestamp. If the stream has no earlier point, it returns `undefined`.
 *
 * Quirk: the final point in a stream is treated as active indefinitely.
 */
const getActivePoint = createSelector(
  'getActivePoint',
  (
    store,
    streamId: StreamId,
    timestamp: number,
  ): Selection<Point | undefined> => {
    const $pointList = getPointList(store, streamId)
    const $index = findPointIndex(store, streamId, {
      startedAt: { lte: timestamp },
    })

    return () => {
      const index = $index.value
      if (typeof index === 'undefined') {
        return undefined
      }
      return $pointList.value[index]
    }
  },
)

export { getActivePoint }
