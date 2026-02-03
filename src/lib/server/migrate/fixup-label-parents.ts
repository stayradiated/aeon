import type { LabelId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label, Point } from '#lib/server/types.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { updateLabel } from '#lib/server/db/label/update-label.js'
import { getPointIterator } from '#lib/server/db/point/get-point-iterator.js'

import { withPeek } from '#lib/utils/peek.js'

const PAGE_SIZE = 500

class LabelCache {
  // { [parentLabelId]: { [labelName]: Label } }
  #byProperty: Record<LabelId | 'null', Record<string, Label>>
  #byId: Record<LabelId, Label>

  constructor(labelList: Label[]) {
    this.#byId = Object.fromEntries(labelList.map((label) => [label.id, label]))
    this.#byProperty = { null: {} }
    for (const label of labelList) {
      for (const parentLabelId of label.parentLabelIdList) {
        this.setByProperty(parentLabelId, label.name, label)
      }
    }
  }

  getById(labelId: LabelId): Label | undefined {
    return this.#byId[labelId]
  }

  getByProperty(
    parentLabelId: LabelId | null,
    labelName: string,
  ): Label | undefined {
    const parentLabelKey = parentLabelId ?? 'null'
    return this.#byProperty[parentLabelKey]?.[labelName]
  }

  setByProperty(
    parentLabelId: LabelId | null,
    labelName: string,
    label: Label,
  ): void {
    const parentLabelKey = parentLabelId ?? 'null'
    this.#byProperty[parentLabelKey] ??= {}
    this.#byProperty[parentLabelKey][labelName] = label
  }
}

type AddLabelParentIdOptions = {
  db: KyselyDb
  userId: UserId
  label: Label
  parentLabelId: LabelId
}

const addLabelParentId = async (
  options: AddLabelParentIdOptions,
): Promise<void | Error> => {
  const { db, userId, label, parentLabelId } = options

  if (label.parentLabelIdList.includes(parentLabelId)) {
    return new Error(
      `Label "${label.name}" already has this parentId. Skipping.`,
    )
  }

  // TODO: mutating the label isn't ideal
  label.parentLabelIdList.push(parentLabelId)

  const updatedLabel = await updateLabel({
    db,
    where: { labelId: label.id, userId },
    set: { parentLabelIdList: label.parentLabelIdList },
  })
  if (updatedLabel instanceof Error) {
    return updatedLabel
  }
}

type FixupLabelParentsOptions = {
  db: KyselyDb
  streamId: StreamId
  parentStreamId: StreamId
  userId: UserId
}

type Result = {
  processedPointCount: number
  processedLabelCount: number
  updatedLabelCount: number
}

const fixupLabelParents = async (
  options: FixupLabelParentsOptions,
): Promise<Result | Error> => {
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
  const labelCache = new LabelCache(streamLabelList)

  /*
   * for a given stream
   * iterate through each point in that stream, chronologically
   * iterate through each label of that point
   * compare that label's parentId to the label of the active point in the
   * parent stream
   * and if the label doesn't have the parentId, we add it to the label
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

  const output: Result = {
    processedPointCount: 0,
    processedLabelCount: 0,
    updatedLabelCount: 0,
  }

  // holds the the current parent point
  let parentPoint: Point | undefined

  for await (const point of pointIterator) {
    if (point instanceof Error) {
      return point
    }

    output.processedPointCount += 1

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
      // No parent point available, so we skip this point
      continue
    }

    const parentLabelId = parentPoint.labelIdList.at(0)

    for (const labelId of point.labelIdList) {
      const label = labelCache.getById(labelId)
      if (!label) {
        return new Error(`Cannot find label ID "${labelId}".`)
      }

      output.processedLabelCount += 1

      if (!parentLabelId) {
        // no parent label, so we don't need to do anything
        continue
      }

      if (label.parentLabelIdList.includes(parentLabelId)) {
        // label already has the correct parentId, so we don't need to do anything
        continue
      }

      const error = await addLabelParentId({
        db,
        userId,
        parentLabelId,
        label,
      })
      if (error instanceof Error) {
        return error
      }
      output.updatedLabelCount += 1
    }
  }

  return output
}

export { fixupLabelParents }
