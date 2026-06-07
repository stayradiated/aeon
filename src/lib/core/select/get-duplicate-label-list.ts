import type { StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'
import type { Selection } from '#lib/utils/selector.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLabelList } from './get-label-list.js'

const normalizeLabelName = (label: Label): string => {
  return label.name.toLowerCase().trim()
}

/**
 * Finds groups of labels in a stream that have the same normalized name.
 *
 * Use this to power label cleanup and deduplication UI. Normalization is limited
 * to trimming whitespace and lower-casing the label name.
 */
const getDuplicateLabelList = createSelector(
  'getDuplicateLabelList',
  (store, streamId: StreamId): Selection<Label[][]> => {
    const $labelList = getLabelList(store, streamId)

    return () => {
      const labelList = $labelList.value

      // we build a record storing the normalized name of each label
      // mapping to the list of labels with that name
      const record: Record<string, Label[]> = {}
      for (const label of labelList) {
        const normalizedName = normalizeLabelName(label)
        if (record[normalizedName]) {
          record[normalizedName].push(label)
        } else {
          record[normalizedName] = [label]
        }
      }
      const duplicateLabelGroupList: Label[][] = []
      for (const labelList of Object.values(record)) {
        if (labelList.length > 1) {
          duplicateLabelGroupList.push(labelList)
        }
      }

      return duplicateLabelGroupList
    }
  },
)

export { getDuplicateLabelList }
