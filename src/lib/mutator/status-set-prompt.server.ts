import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { getStatus } from '#lib/server/db/status/get-status.js'
import { insertStatus } from '#lib/server/db/status/insert-status.js'
import { updateStatus } from '#lib/server/db/status/update-status.js'

const statusSetPrompt: ServerMutator<'status_setPrompt'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { prompt } = options

  const prevStatus = await getStatus({ db, where: { userId: sessionUserId } })
  if (prevStatus instanceof Error) {
    return prevStatus
  }

  if (!prevStatus) {
    const result = await insertStatus({
      db,
      set: {
        userId: sessionUserId,
        enabledAt: null,
        prompt,
        streamIdList: [],
        hash: '',
        status: '',
        emoji: '',
        expiresAt: null,
      },
    })
    if (result instanceof Error) {
      return result
    }
  } else {
    const result = await updateStatus({
      db,
      where: { userId: sessionUserId },
      set: {
        prompt,
      },
    })
    if (result instanceof Error) {
      return result
    }
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default statusSetPrompt
