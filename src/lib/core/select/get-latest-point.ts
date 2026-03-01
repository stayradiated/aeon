import type { Signal } from 'signia'
import { computed } from 'signia'

import type { StreamId } from '#lib/ids.js'
import type { Point } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

import { getPointList } from './get-point-list.js'

const getLatestPoint = createSelector(
  'getLatestPoint',
  (store, streamId: StreamId): Signal<Point | undefined> => {
    const $pointList = getPointList(store, streamId)

    return computed('getLatestPoint', () => {
      const pointList = $pointList.value
      return pointList.at(-1)
    })
  },
)

export { getLatestPoint }
