import { computed } from 'signia'

import { createSelector } from '#lib/utils/selector.js'

const getStreamList = createSelector('getStreamList', (store) => {
  return computed('getStreamList', () => {
    return store.stream.asList.value.toSorted((a, b) => {
      return a.sortOrder - b.sortOrder
    })
  })
})

export { getStreamList }
