import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label, PointWithLabelList } from '#lib/server/types.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { insertLabel } from '#lib/server/db/label/insert-label.js'
import { updateLabel } from '#lib/server/db/label/update-label.js'
import { getPointIterator } from '#lib/server/db/point/get-point-iterator.js'
import { updatePointLabel } from '#lib/server/db/point/update-point-label.js'

import { genId } from '#lib/utils/gen-id.js'
import { withPeek } from '#lib/utils/peek.js'

const PAGE_SIZE = 500

type FixupLabelParentsOptions = {
  db: KyselyDb
  streamId: StreamId
  parentStreamId: StreamId
  userId: UserId
}

const fixupLabelParents = async (
  options: FixupLabelParentsOptions,
): Promise<void | Error> => {
  const { db, streamId, parentStreamId, userId } = options

  const streamLabelList = await getLabelList({
    db,
    where: {
      userId,
      streamId,
    },
  })
  if (streamLabelList instanceof Error) {
    return new Error('Failed to getLabelList', { cause: streamLabelList })
  }
  const streamLabelRecord = Object.fromEntries(
    streamLabelList.map((label) => [label.id, label]),
  )

  type Mutation = Pick<Label, 'parentId'>
  const mutationRecord: Record<LabelId, Mutation> = {}

  const resolveLabel = (labelId: LabelId): Label | Error => {
    const label = streamLabelRecord[labelId]
    if (!label) {
      return new Error(`Cannot resolve label ID "${labelId}".`)
    }
    const mutation = mutationRecord[labelId]
    if (mutation) {
      return { ...label, ...mutation }
    }
    return label
  }

  type SetLabelParentIdOptions = {
    labelId: LabelId
    parentLabelId: LabelId | null
  }
  const setLabelParentId = async (
    options: SetLabelParentIdOptions,
  ): Promise<void | Error> => {
    const { labelId, parentLabelId } = options

    const label = resolveLabel(labelId)
    if (label instanceof Error) {
      return label
    }
    if (mutationRecord[labelId]) {
      return new Error(
        `Label "${label.name}" already has a parentId. Skipping.`,
      )
    }
    mutationRecord[labelId] = { parentId: parentLabelId ?? null }

    const updatedLabel = await updateLabel({
      db,
      where: { labelId, userId },
      set: { parentId: parentLabelId },
    })
    if (updatedLabel instanceof Error) {
      return updatedLabel
    }
  }

  type StreamIdAndName = `${StreamId}:${string}`
  const labelCacheRecord: Record<StreamIdAndName, Label> = {}

  type DuplicateLabelAndUpdatePointOptions = {
    pointId: PointId
    labelId: LabelId
    parentLabelId: LabelId | null
  }

  const duplicateLabelAndUpdatePoint = async (
    options: DuplicateLabelAndUpdatePointOptions,
  ): Promise<void | Error> => {
    const { pointId, labelId, parentLabelId } = options

    const label = resolveLabel(labelId)
    if (label instanceof Error) {
      return label
    }
    const key: StreamIdAndName = `${parentStreamId}:${label.name}`
    if (!labelCacheRecord[key]) {
      const newLabel = await insertLabel({
        db,
        set: {
          ...label,
          id: genId(),
          parentId: parentLabelId,
        },
      })
      if (newLabel instanceof Error) {
        return newLabel
      }
      labelCacheRecord[key] = newLabel
    }
    const nextLabel = labelCacheRecord[key]
    if (!nextLabel) {
      return new Error(`Failed to duplicate label "${label.name}".`)
    }
    const result = await updatePointLabel({
      db,
      where: { pointId, labelId, userId },
      set: { labelId: nextLabel.id },
    })
    if (result instanceof Error) {
      return result
    }
  }

  /*
   * for a given stream
   * iterate through each point in that stream, chronologically
   * iterate through each label of that point
   * compare that label's parentId to the label of the active point in the parent stream
   * if the label doesn't have a parentId, set it to the parent streams active point's label
   * if the label already has a parentId, but it's different, duplicate the label and set the new label's parentId to the active point's label and then update the point to use this new label
   */

  const pointIterator = getPointIterator({
    db,
    where: { userId, streamId },
    pageSize: PAGE_SIZE,
  })

  const parentStreamPointIterator = withPeek(
    getPointIterator({
      db,
      where: { userId, streamId: parentStreamId },
      pageSize: PAGE_SIZE,
    }),
  )

  // holds the the current parent point
  let parentPoint: PointWithLabelList | undefined

  for await (const point of pointIterator) {
    if (point instanceof Error) {
      return point
    }

    // iterate through the parent stream until we find a point that matches the current point's label
    while (true) {
      const nextParentPoint = await parentStreamPointIterator.peek()
      if (nextParentPoint instanceof Error) {
        return nextParentPoint
      }
      if (!nextParentPoint) {
        // we've reached the end of the parent stream
        break
      }
      if (nextParentPoint.startedAt > point.startedAt) {
        // the next parent point is in the future, so we stop here
        break
      }

      // otherwise, the next parent point becomes our parent point
      parentPoint = nextParentPoint

      // important, let's move the iterator forward
      // otherwise we'll keep looping and looping and looping
      await parentStreamPointIterator.next()
    }

    if (!parentPoint) {
      console.error(`No parent point found for point "${point.id}".`)
      return
    }
    const parentLabelId = parentPoint.labelIdList.at(0) ?? null

    for (const labelId of point.labelIdList) {
      const label = resolveLabel(labelId)
      if (label instanceof Error) {
        return label
      }

      if (label.parentId === parentLabelId) {
        // label already has the correct parentId, so we don't need to do anything
        continue
      }

      if (!label.parentId) {
        const result = await setLabelParentId({
          labelId: label.id,
          parentLabelId,
        })
        if (result instanceof Error) {
          return result
        }
        continue
      }

      const result = await duplicateLabelAndUpdatePoint({
        pointId: point.id,
        labelId: label.id,
        parentLabelId,
      })
      if (result instanceof Error) {
        return result
      }
    }
  }
}

export { fixupLabelParents }
