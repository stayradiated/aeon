import type { LabelId, StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLabelCountRecord } from './get-label-count-record.js'

const getLabelCount = createSelector(
  'getLabelCount',
  (
    store,
    streamId: StreamId,
    where: {
      labelId: LabelId
      startedAt: {
        gte: number
        lte: number
      }
    },
  ): Selection<number> => {
    const $labelCountRecord = getLabelCountRecord(store, streamId, {
      startedAt: where.startedAt,
    })

    return () => {
      return $labelCountRecord.value[where.labelId] ?? 0
    }
  },
)

export { getLabelCount }
