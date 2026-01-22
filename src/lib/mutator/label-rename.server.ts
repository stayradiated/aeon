import type { ServerMutator } from './types.ts'

import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelRename: ServerMutator<'label_rename'> = async (context, options) => {
  const { db } = context
  const { labelId, name } = options

  const result = await updateLabel({
    db,
    where: {
      userId: context.sessionUserId,
      labelId,
    },
    set: {
      name,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default labelRename
