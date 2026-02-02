import type { Signal } from 'signia'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLabelList } from './get-label-list.js'

const getFilteredLabelList = createSelector(
  'getFilteredLabelList',
  (
    store,
    streamId: StreamId,
    parentIdList: readonly LabelId[],
  ): Signal<Label[]> => {
    const $labelList = getLabelList(store, streamId)
    const parentIdSet =
      parentIdList.length > 0 ? new Set(parentIdList) : undefined

    return computed('getFilteredLabelList', () => {
      const labelList = $labelList.value

      if (parentIdSet === undefined) {
        // return all labels
        return labelList
      }
      return labelList.filter((label) => {
        for (const parentLabelId of label.parentLabelIdList) {
          if (parentIdSet.has(parentLabelId)) {
            return true
          }
        }
        return false
      })
    })
  },
)

export { getFilteredLabelList }
