import { computed } from 'signia'

import { createSelector } from '#lib/utils/selector.js'

import { getStreamList } from './get-stream-list.js'
import { getTimeZoneStream } from './get-time-zone-stream.js'

const getVisibleStreamList = createSelector('getVisibleStreamList', (store) => {
  const $streamList = getStreamList(store)
  const $timeZoneStream = getTimeZoneStream(store)

  return computed('getVisibleStreamList', () => {
    const streamList = $streamList.value
    const timeZoneStream = $timeZoneStream.value

    return streamList.filter((stream) => {
      return stream.id !== timeZoneStream?.id
    })
  })
})

export { getVisibleStreamList }
