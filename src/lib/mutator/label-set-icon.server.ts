import type { ServerMutator } from './types.ts'

import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelSetIcon: ServerMutator<'label_setIcon'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { labelId, icon } = options

  const result = await updateLabel({
    db,
    where: {
      userId: sessionUserId,
      labelId,
    },
    set: {
      icon: icon ?? null,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default labelSetIcon
