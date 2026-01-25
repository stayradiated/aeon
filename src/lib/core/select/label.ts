import type { Signal } from 'signia'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { groupBy } from '#lib/utils/group-by.js'
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

const getLabelListByParent = createSelector(
  'getLabelListByParent',
  (
    store,
    streamId: StreamId,
    parentIdList: readonly LabelId[],
  ): Signal<Label[]> => {
    const $labelList = getLabelList(store, streamId)
    const parentIdSet =
      parentIdList.length > 0 ? new Set(parentIdList) : undefined

    return computed('getLabelListByParent', () => {
      const labelList = $labelList.value

      if (parentIdSet === undefined) {
        return labelList.filter((label) => {
          return label.parentId === undefined
        })
      }
      return labelList.filter((label) => {
        if (label.parentId === undefined) {
          return false
        }
        return parentIdSet.has(label.parentId)
      })
    })
  },
)

export { getLabelList, getLabelListGroupedByParent, getLabelListByParent }
