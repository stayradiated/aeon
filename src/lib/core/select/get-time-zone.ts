import type { Signal } from 'signia'
import { computed } from 'signia'

import { createSelector } from '#lib/utils/selector.js'

import { getActivePoint } from './get-active-point.js'
import { getTimeZoneStream } from './get-time-zone-stream.js'

const getTimeZone = createSelector(
  'getTimeZone',
  (store, timestamp: number): Signal<string> => {
    const $timeZoneStream = getTimeZoneStream(store)

    return computed('getTimeZone', () => {
      const timeZoneStream = $timeZoneStream.value
      if (!timeZoneStream) {
        console.warn('Time Zone stream not found')
        return 'UTC'
      }

      const activePoint = getActivePoint(
        store,
        timeZoneStream.id,
        timestamp,
      ).value
      if (!activePoint) {
        console.warn('No active point for Time Zone stream')
        return 'UTC'
      }

      return activePoint.description
    })
  },
)

export { getTimeZone }
