import type { ServerMutator } from './types.js'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { upsertStatus } from '#lib/server/db/status/upsert-status.js'

const statusToggleEnabled: ServerMutator<'status_toggleEnabled'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { isEnabled } = options

  const enabledAt = isEnabled ? Date.now() : null

  const status = await upsertStatus({
    db,
    where: {
      userId: sessionUserId,
    },
    insert: {
      enabledAt,
      prompt: '',
      streamIdList: [],
      hash: '',
      status: '',
      emoji: '',
      expiresAt: null,
      messageLog: null,
    },
    update: {
      enabledAt,
    },
  })
  if (status instanceof Error) {
    return status
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default statusToggleEnabled
