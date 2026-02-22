import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelRename: ServerMutator<'label_rename'> = async (context, options) => {
  const { db, sessionUserId } = context
  const { labelId, name } = options

  const result = await updateLabel({
    db,
    where: {
      userId: sessionUserId,
      labelId,
    },
    set: {
      name,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default labelRename
