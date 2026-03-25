import type { ServerMutator } from './types.js'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { upsertStatus } from '#lib/server/db/status/upsert-status.js'

const statusSetPrompt: ServerMutator<'status_setPrompt'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { prompt } = options

  const result = await upsertStatus({
    db,
    where: {
      userId: sessionUserId,
    },
    insert: {
      enabledAt: null,
      prompt,
      streamIdList: [],
      hash: '',
      status: '',
      emoji: '',
      expiresAt: null,
      messageLog: {},
    },
    update: {
      prompt,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default statusSetPrompt
