import type { StreamId } from '#lib/ids.js'

import { createSelector } from '#lib/utils/selector.js'

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
