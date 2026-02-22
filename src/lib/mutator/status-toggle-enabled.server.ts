import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { getStatus } from '#lib/server/db/status/get-status.js'
import { insertStatus } from '#lib/server/db/status/insert-status.js'
import { updateStatus } from '#lib/server/db/status/update-status.js'

const statusToggleEnabled: ServerMutator<'status_toggleEnabled'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { isEnabled } = options

  const prevStatus = await getStatus({ db, where: { userId: sessionUserId } })
  if (prevStatus instanceof Error) {
    return prevStatus
  }

  const enabledAt = isEnabled ? Date.now() : null

  if (!prevStatus) {
    const result = await insertStatus({
      db,
      set: {
        userId: sessionUserId,
        enabledAt,
        prompt: '',
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
        enabledAt,
      },
    })
    if (result instanceof Error) {
      return result
    }
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default statusToggleEnabled
