import type { LabelId, StreamId } from '#lib/ids.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLabelCountRecord } from './get-label-count-record.js'

/**
 * Returns the point-occurrence count for one label in a started-at range.
 *
 * Use this for label summary stats such as "events in the last year". This is a
 * thin wrapper around `getLabelCountRecord` and inherits its counting semantics.
 *
 * Bug: inherits the index-`0` range bug from `getLabelCountRecord`.
 */
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
