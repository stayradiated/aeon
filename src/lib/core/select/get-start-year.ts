import type { StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getPointList } from './get-point-list.js'

const getStartYear = createSelector(
  'getStartYear',
  (store, streamId: StreamId): Selection<number | undefined> => {
    const $pointList = getPointList(store, streamId)
    return () => {
      const pointList = $pointList.value
      const firstStartedAt = pointList[0]?.startedAt
      if (!firstStartedAt) {
        return undefined
      }
      return new Date(firstStartedAt).getUTCFullYear()
    }
  },
)

export { getStartYear }
