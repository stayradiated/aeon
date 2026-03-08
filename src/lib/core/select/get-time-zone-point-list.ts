import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Point } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

import { findPointIndex } from './find-point-index.js'
import { getPointList } from './get-point-list.js'
import { getTimeZoneStream } from './get-time-zone-stream.js'

const getTimeZonePointList = createSelector(
  'getTimeZonePointList',
  (
    store,
    where: {
      startedAt: {
        gte: number
        lte: number
      }
    },
  ): Signal<Point[]> => {
    const $timeZoneStream = getTimeZoneStream(store)

    return computed('getTimeZonePointList', () => {
      const timeZoneStream = $timeZoneStream.value
      if (!timeZoneStream) {
        console.warn('Time Zone stream not found')
        return []
      }

      const startPointIndex = findPointIndex(store, timeZoneStream.id, {
        startedAt: { lte: where.startedAt.gte },
      }).value
      if (typeof startPointIndex === 'undefined') {
        return []
      }

      const endPointIndex = findPointIndex(store, timeZoneStream.id, {
        startedAt: { lte: where.startedAt.lte },
      }).value
      if (typeof endPointIndex === 'undefined') {
        return []
      }

      const timeZonePointList = getPointList(store, timeZoneStream.id).value
      return timeZonePointList.slice(startPointIndex, endPointIndex + 1)
    })
  },
)

export { getTimeZonePointList }
