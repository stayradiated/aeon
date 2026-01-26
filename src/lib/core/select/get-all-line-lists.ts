import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Line } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLineListForStream } from './get-line-list-for-stream.js'

const getAllLineLists = createSelector(
  'getAllLineLists',
  (
    store,
    where: {
      startedAt: { gte: number; lte?: number }
    },
  ): Signal<Record<StreamId, Line[]>> => {
    return computed('getAllLineLists', () => {
      return Object.fromEntries(
        store.stream.keys.value.map((streamId) => {
          return [
            streamId,
            getLineListForStream(store, streamId, where).value,
          ] as const
        }),
      )
    })
  },
)

export { getAllLineLists }
