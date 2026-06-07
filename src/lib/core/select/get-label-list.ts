import type { StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

const getLabelList = createSelector(
  'getLabelList',
  (store, streamId: StreamId): Selection<Label[]> => {
    const $filteredLabelList = store.label.filter(
      `streamId:${streamId}`,
      (value) => {
        return value.streamId === streamId
      },
    )

    return () => {
      return $filteredLabelList.value.toSorted((a, b) => {
        return a.name.localeCompare(b.name)
      })
    }
  },
)

export { getLabelList }
