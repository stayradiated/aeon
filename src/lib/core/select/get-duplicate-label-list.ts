import type { Signal } from 'signia'
import { computed } from 'signia'

import type { StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

import { getLabelList } from './get-label-list.js'

const normalizeLabelName = (label: Label): string => {
  return label.name.toLowerCase().trim()
}

const getDuplicateLabelList = createSelector(
  'getDuplicateLabelList',
  (store, streamId: StreamId): Signal<Label[][]> => {
    const $labelList = getLabelList(store, streamId)

    return computed('getDuplicateLabelList', () => {
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
    })
  },
)

export { getDuplicateLabelList }
