import type { ServerMutator } from './types.ts'

import { getLabel } from '#lib/server/db/label/get-label.js'
import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelAddParentLabel: ServerMutator<'label_addParentLabel'> = async (
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

  if (label.parentLabelIdList.includes(parentLabelId)) {
    // parent label already exists
    return
  }

  const parentLabelIdList = [...label.parentLabelIdList, parentLabelId]

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

export default labelAddParentLabel
