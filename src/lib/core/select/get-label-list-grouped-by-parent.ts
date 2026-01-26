import type { Signal } from 'signia'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { groupBy } from '#lib/utils/group-by.js'
import { createSelector } from '#lib/utils/selector.js'

import { getLabelList } from './get-label-list.js'

const getLabelListGroupedByParent = createSelector(
  'getParentLabelList',
  (
    store,
    streamId: StreamId,
  ): Signal<(readonly [Label | undefined, Label[]])[]> => {
    const $labelList = getLabelList(store, streamId)

    return computed('getParentLabelList', () => {
      const labelList = $labelList.value

      const groupedList = groupBy(labelList, (label) => {
        return label.parentId ?? ''
      })

      const parentLabelList = Object.entries(groupedList)
        .map(([parentId, labelList]) => {
          if (parentId === '') {
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
