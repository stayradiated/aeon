import type { Signal } from 'signia'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { groupByMultiple } from '#lib/utils/group-by.js'
import { createSelector } from '#lib/utils/selector.js'

import { getLabelList } from './get-label-list.js'

const NO_PARENT_KEY = ''

const getLabelListGroupedByParent = createSelector(
  'getParentLabelList',
  (
    store,
    streamId: StreamId,
  ): Signal<(readonly [Label | undefined, Label[]])[]> => {
    const $labelList = getLabelList(store, streamId)

    return computed('getParentLabelList', () => {
      const labelList = $labelList.value

      const groupedList = groupByMultiple(labelList, (label) => {
        if (label.parentLabelIdList.length === 0) {
          return [NO_PARENT_KEY]
        }
        return label.parentLabelIdList
      })

      const parentLabelList = Object.entries(groupedList)
        .map(([parentId, labelList]) => {
          if (parentId === NO_PARENT_KEY) {
            return [undefined, labelList] as const
          }
          const parentLabel = store.label.get(parentId as LabelId).value
          return [parentLabel, labelList] as const
        })
        .sort((a, b) => {
          const aName = a[0]?.name ?? ''
          const bName = b[0]?.name ?? ''
          return aName.localeCompare(bName)
        })

      return parentLabelList
    })
  },
)

export { getLabelListGroupedByParent }
