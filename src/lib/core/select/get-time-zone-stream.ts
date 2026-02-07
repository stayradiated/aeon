import type { Signal } from 'signia'

import type { Stream } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

const getTimeZoneStream = createSelector(
  'getTimeZone',
  (store): Signal<Stream | undefined> => {
    return store.stream.find('.name === "Time Zone"', (stream) => {
      return stream.name === 'Time Zone'
    })
  },
)

export { getTimeZoneStream }
