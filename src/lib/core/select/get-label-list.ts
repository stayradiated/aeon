import type { Signal } from 'signia'
import { computed } from 'signia'

import type { StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

const getLabelList = createSelector(
  'getLabelList',
  (store, streamId: StreamId): Signal<Label[]> => {
    const $filteredLabelList = store.label.filter((value) => {
      return value.streamId === streamId
    })

    return computed('getLabelList', () => {
      return $filteredLabelList.value.toSorted((a, b) => {
        return a.name.localeCompare(b.name)
      })
    })
  },
)

export { getLabelList }
