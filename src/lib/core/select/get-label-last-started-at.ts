import type { LabelId, StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getPointList } from './get-point-list.js'

const getLabelLastStartedAt = createSelector(
  'getLabelLastStartedAt',
  (
    store,
    streamId: StreamId,
    labelId: LabelId,
  ): Selection<number | undefined> => {
    const $pointList = getPointList(store, streamId)

    return () => {
      const pointList = $pointList.value

      // iterate backwards through point list
      const length = pointList.length
      for (let i = length - 1; i >= 0; i -= 1) {
        const point = pointList[i]
        if (!point) {
          continue
        }

        if (point.labelIdList.includes(labelId)) {
          return point.startedAt
        }
      }

      return undefined
    }
  },
)

export { getLabelLastStartedAt }
