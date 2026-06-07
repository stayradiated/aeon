import type { StreamId } from '#lib/ids.js'
import type { Point } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getActivePoint } from './get-active-point.js'

/**
 * Returns the active point for every stream at a timestamp, keyed by stream id.
 *
 * Use this when rendering or editing a complete snapshot of all streams at a
 * particular time. Streams with no active point at the timestamp are omitted.
 */
const getActivePointRecord = createSelector(
  'getActivePointRecord',
  (store, timestamp: number): Selection<Record<StreamId, Point>> => {
    return () => {
      return Object.fromEntries(
        store.stream.keys.value.flatMap<[StreamId, Point]>((streamId) => {
          const point = getActivePoint(store, streamId, timestamp).value
          if (!point) {
            return [] as never[]
          }
          return [[streamId, point]]
        }),
      )
    }
  },
)

export { getActivePointRecord }
