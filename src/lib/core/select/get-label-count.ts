import type { Signal } from 'signia'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'

import { createSelector } from '#lib/utils/selector'

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
  ): Signal<number> => {
    const $labelCountRecord = getLabelCountRecord(store, streamId, {
      startedAt: where.startedAt,
    })

    return computed('getLabelCount', () => {
      return $labelCountRecord.value[where.labelId] ?? 0
    })
  },
)

export { getLabelCount }
