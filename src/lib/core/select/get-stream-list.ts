import { createSelector } from '#lib/utils/selector.js'

/**
 * Returns all streams sorted by their configured sort order.
 *
 * Use this as the base selector whenever UI needs the canonical stream ordering.
 */
const getStreamList = createSelector('getStreamList', (store) => {
  return () => {
    return store.stream.asList.value.toSorted((a, b) => {
      return a.sortOrder - b.sortOrder
    })
  }
})

export { getStreamList }
