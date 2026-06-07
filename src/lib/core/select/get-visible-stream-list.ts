import { createSelector } from '#lib/utils/selector.js'

import { getStreamList } from './get-stream-list.js'
import { getTimeZoneStream } from './get-time-zone-stream.js'

/**
 * Returns user-facing streams in sort order, excluding the time-zone stream.
 *
 * Use this for stream selectors and log columns where the internal time-zone
 * stream should not appear as a normal tracked stream.
 */
const getVisibleStreamList = createSelector('getVisibleStreamList', (store) => {
  const $streamList = getStreamList(store)
  const $timeZoneStream = getTimeZoneStream(store)

  return () => {
    const streamList = $streamList.value
    const timeZoneStream = $timeZoneStream.value

    return streamList.filter((stream) => {
      return stream.id !== timeZoneStream?.id
    })
  }
})

export { getVisibleStreamList }
