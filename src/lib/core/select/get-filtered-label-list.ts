import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLabelList } from './get-label-list.js'

/**
 * Returns the labels available for a stream, optionally filtered by parent labels.
 *
 * Use this when choosing labels for a point in a child stream: if parent labels
 * are supplied, a label is included when any of its parents matches one of them.
 *
 * Quirk: an empty parent list means "no filter" and returns every label, not
 * only root labels.
 */
const getFilteredLabelList = createSelector(
  'getFilteredLabelList',
  (
    store,
    streamId: StreamId,
    parentIdList: readonly LabelId[],
  ): Selection<Label[]> => {
    const $labelList = getLabelList(store, streamId)
    const parentIdSet =
      parentIdList.length > 0 ? new Set(parentIdList) : undefined

    return () => {
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
    }
  },
)

export { getFilteredLabelList }
