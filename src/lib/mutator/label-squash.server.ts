import { listOrError } from '@stayradiated/error-boundary'

import type { LabelId } from '#lib/ids.js'
import type { Label } from '#lib/server/types.js'
import type { ServerMutator } from './types.ts'

import { bulkDeleteLabel } from '#lib/server/db/label/bulk-delete-label.js'
import { bulkDeleteLabelParent } from '#lib/server/db/label/bulk-delete-label-parent.js'
import { bulkUpsertLabelParent } from '#lib/server/db/label/bulk-upsert-label-parent.js'
import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getLabelParentList } from '#lib/server/db/label/get-label-parent-list.js'
import { updateLabel } from '#lib/server/db/label/update-label.js'
import { bulkDeletePointLabel } from '#lib/server/db/point/bulk-delete-point-label.js'
import { bulkUpsertPointLabel } from '#lib/server/db/point/bulk-upsert-point-label.js'
import { getPointLabelList } from '#lib/server/db/point/get-point-label-list.js'

const labelSquash: ServerMutator<'label_squash'> = async (context, options) => {
  const { db, sessionUserId } = context
  const { sourceLabelIdList, destinationLabelId } = options

  // validate that the destination is not in the source list
  if (sourceLabelIdList.includes(destinationLabelId)) {
    return new Error('Destination label cannot be in source list')
  }

  // read all labels from the source and destination
  const labelList = await getLabelList({
    db,
    where: {
      labelId: { in: [destinationLabelId, ...sourceLabelIdList] },
      userId: sessionUserId,
    },
  })
  if (labelList instanceof Error) {
    return labelList
  }
  const labelRecord: Record<LabelId, Label> = Object.fromEntries(
    labelList.map((label) => [label.id, label]),
  )

  const destinationLabel = labelRecord[destinationLabelId]
  if (!destinationLabel) {
    return new Error(`Destination label not found: ${destinationLabelId}`)
  }

  const sourceLabelList = listOrError(
    sourceLabelIdList.map((labelId) => {
      const label = labelRecord[labelId]
      if (!label) {
        return new Error(`Source label not found: ${labelId}`)
      }
      return label
    }),
  )
  if (sourceLabelList instanceof Error) {
    return sourceLabelList
  }

  // ensure all source labels are in the same stream as the destination label
  for (const sourceLabel of sourceLabelList) {
    if (sourceLabel.streamId !== destinationLabel.streamId) {
      return new Error(
        'Source and destination labels must be in the same stream',
      )
    }
  }

  /*
   * Label Parents
   * ===========================================================================
   */

  // get all label parents that currently refer to the source labels
  const labelParentList = await getLabelParentList({
    db,
    where: {
      userId: sessionUserId,
      parentLabelId: { in: sourceLabelIdList },
    },
  })
  if (labelParentList instanceof Error) {
    return new Error('Failed to get label parent list', {
      cause: labelParentList,
    })
  }
  const labelIdSet = new Set(labelParentList.map((row) => row.labelId))

  // update all child labels that refer to the source labels
  // to refer to the destination label
  if (labelIdSet.size > 0) {
    const upsertLabelParentResult = await bulkUpsertLabelParent({
      db,
      values: Array.from(labelIdSet).map((labelId) => ({
        labelId,
        parentLabelId: destinationLabelId,
        userId: sessionUserId,
      })),
    })
    if (upsertLabelParentResult instanceof Error) {
      return new Error('Failed to update label parents', {
        cause: upsertLabelParentResult,
      })
    }
  }

  // delete any label parents that refer to the source labels
  const deleteLabelParentResult = await bulkDeleteLabelParent({
    db,
    where: {
      userId: sessionUserId,
      parentLabelId: { in: sourceLabelIdList },
    },
  })
  if (deleteLabelParentResult instanceof Error) {
    return new Error('Failed to delete redundant label parents', {
      cause: deleteLabelParentResult,
    })
  }

  /*
   * Point Labels
   * ===========================================================================
   */

  // get a list of all points that currently refer to the source labels
  const pointLabelList = await getPointLabelList({
    db,
    where: {
      userId: sessionUserId,
      streamId: destinationLabel.streamId,
      labelId: { in: sourceLabelIdList },
    },
  })
  if (pointLabelList instanceof Error) {
    return new Error('Failed to get point label list', {
      cause: pointLabelList,
    })
  }
  const pointIdSet = new Set(pointLabelList.map((row) => row.pointId))

  // add the destination label to all points that refer to the source labels
  // (if the point already has the destination label, then it is no-op)
  if (pointIdSet.size > 0) {
    const upsertPointLabelResult = await bulkUpsertPointLabel({
      db,
      values: Array.from(pointIdSet).map((pointId) => ({
        pointId,
        userId: sessionUserId,
        labelId: destinationLabelId,
        streamId: destinationLabel.streamId,
      })),
    })
    if (upsertPointLabelResult instanceof Error) {
      return new Error('Failed to upsert point labels', {
        cause: upsertPointLabelResult,
      })
    }
  }

  // remove the source labels from any linked points
  const deletePointLabelsResult = await bulkDeletePointLabel({
    db,
    where: {
      userId: sessionUserId,
      streamId: destinationLabel.streamId,
      labelId: { in: sourceLabelIdList },
    },
  })
  if (deletePointLabelsResult instanceof Error) {
    return new Error('Failed to delete point labels', {
      cause: deletePointLabelsResult,
    })
  }

  /*
   * Update Destination Label
   * ===========================================================================
   */

  // merge all parent labels from the source and destination label
  const parentLabelIdSet = new Set(destinationLabel.parentLabelIdList)
  for (const sourceLabel of sourceLabelList) {
    for (const parentLabelId of sourceLabel.parentLabelIdList) {
      parentLabelIdSet.add(parentLabelId)
    }
  }
  const parentLabelIdList = Array.from(parentLabelIdSet)

  // persist destination color (if set)
  let color: string | null = destinationLabel.color
  for (const sourceLabel of sourceLabelList) {
    if (typeof color === 'string') {
      break
    }
    if (sourceLabel.color) {
      color = sourceLabel.color
    }
  }

  // persist destination icon (if set)
  let icon: string | null = destinationLabel.icon
  for (const sourceLabel of sourceLabelList) {
    if (typeof icon === 'string') {
      break
    }
    if (sourceLabel.icon) {
      icon = sourceLabel.icon
    }
  }

  // update the destination label to include properties from the source label
  const updateLabelResult = await updateLabel({
    db,
    where: {
      labelId: destinationLabelId,
      userId: sessionUserId,
    },
    set: {
      color,
      icon,
      parentLabelIdList,
    },
  })
  if (updateLabelResult instanceof Error) {
    return new Error('Failed to update label', { cause: updateLabelResult })
  }

  /*
   * Delete Source Labels
   * ===========================================================================
   */

  // delete the source labels
  const deleteResult = await bulkDeleteLabel({
    db,
    where: {
      labelId: { in: sourceLabelIdList },
      userId: sessionUserId,
    },
  })
  if (deleteResult instanceof Error) {
    return new Error('Failed to delete label', { cause: deleteResult })
  }
}

export default labelSquash
