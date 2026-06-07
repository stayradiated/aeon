import type { Signal } from 'signia'

import type { Stream } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

/**
 * Returns the special stream that stores time-zone changes.
 *
 * Use this when converting instants into local calendar dates or when filtering
 * the internal time-zone stream out of user-facing stream lists. The stream is
 * identified by the exact name `Time Zone`.
 */
const getTimeZoneStream = createSelector(
  'getTimeZoneStream',
  (store): Signal<Stream | undefined> => {
    return store.stream.find('.name === "Time Zone"', (stream) => {
      return stream.name === 'Time Zone'
    })
  },
)

export { getTimeZoneStream }
