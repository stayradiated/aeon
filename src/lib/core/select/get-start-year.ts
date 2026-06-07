import type { StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getPointList } from './get-point-list.js'

/**
 * Returns the UTC year of the first point in a stream.
 *
 * Use this to decide how far back label or stream history views should offer
 * year-based navigation.
 *
 */
const getStartYear = createSelector(
  'getStartYear',
  (store, streamId: StreamId): Selection<number | undefined> => {
    const $pointList = getPointList(store, streamId)
    return () => {
      const pointList = $pointList.value
      const firstStartedAt = pointList[0]?.startedAt
      if (typeof firstStartedAt === 'undefined') {
        return undefined
      }
      return new Date(firstStartedAt).getUTCFullYear()
    }
  },
)

export { getStartYear }
