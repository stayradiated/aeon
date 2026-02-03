import type { ServerMutator } from './types.ts'

import { getLabel } from '#lib/server/db/label/get-label.js'
import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelRemoveParentLabel: ServerMutator<'label_removeParentLabel'> = async (
  context,
  options,
) => {
  const { db } = context
  const { labelId, parentLabelId } = options

  const label = await getLabel({
    db,
    where: {
      userId: context.sessionUserId,
      labelId,
    },
  })
  if (label instanceof Error) {
    return label
  }
  if (!label) {
    return new Error('Label not found')
  }

  const index = label.parentLabelIdList.indexOf(parentLabelId)
  if (index === -1) {
    // parent label not found
    return
  }

  // remove the parent label from the list
  const parentLabelIdList = label.parentLabelIdList.toSpliced(index, 1)

  const result = await updateLabel({
    db,
    where: {
      userId: context.sessionUserId,
      labelId,
    },
    set: {
      parentLabelIdList,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default labelRemoveParentLabel
