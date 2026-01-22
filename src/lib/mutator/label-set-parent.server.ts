import type { ServerMutator } from './types.ts'

import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelSetParent: ServerMutator<'label_setParent'> = async (
  context,
  options,
) => {
  const { db } = context
  const { labelId, parentId } = options

  const result = await updateLabel({
    db,
    where: {
      userId: context.sessionUserId,
      labelId,
    },
    set: {
      parentId: parentId ?? null,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default labelSetParent
