import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getActivePoint } from './get-active-point.js'
import { getTimeZoneStream } from './get-time-zone-stream.js'

/**
 * Returns the active time-zone name at a timestamp.
 *
 * The value comes from the description of the active point in the special
 * `Time Zone` stream. Use this before formatting instants or deriving local
 * calendar dates.
 *
 * Quirk: missing streams or points fall back to `UTC` and log a warning; the
 * point description is assumed to be a valid time-zone name.
 */
const getTimeZone = createSelector(
  'getTimeZone',
  (store, timestamp: number): Selection<string> => {
    const $timeZoneStream = getTimeZoneStream(store)

    return () => {
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
    }
  },
)

export { getTimeZone }
