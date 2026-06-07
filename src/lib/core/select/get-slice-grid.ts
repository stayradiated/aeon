import type { Selection } from '#lib/utils/selector.js'
import type { SliceGrid } from '#lib/utils/slice-grid.js'

import { createSelector } from '#lib/utils/selector.js'
import { buildSliceGrid } from '#lib/utils/slice-grid.js'

import { getAllLineLists } from './get-all-line-lists.js'
import { getStreamList } from './get-stream-list.js'

const getSliceGrid = createSelector(
  'getSliceList',
  (
    store,
    where: {
      startedAt: { gte: number; lte: number }
    },
  ): Selection<SliceGrid> => {
    const $lineListRecord = getAllLineLists(store, where)
    const $streamList = getStreamList(store)

    return () => {
      const lineListRecord = $lineListRecord.value
      const streamIdList = $streamList.value.map((stream) => stream.id)
      return buildSliceGrid({
        lineListRecord,
        streamIdList,
        startedAt: where.startedAt.gte,
        stoppedAt: where.startedAt.lte,
      })
    }
  },
)

export { getSliceGrid }
