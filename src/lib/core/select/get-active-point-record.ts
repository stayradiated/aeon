import type { StreamId } from '#lib/ids.js'
import type { Point } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getActivePoint } from './get-active-point.js'

const getActivePointRecord = createSelector(
  'getAllPointsAtTime',
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
