import type { StreamId } from '#lib/ids.js'
import type { ServerMutator } from './types.js'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { getStatus } from '#lib/server/db/status/get-status.js'
import { upsertStatus } from '#lib/server/db/status/upsert-status.js'

const statusToggleStream: ServerMutator<'status_toggleStream'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { streamId, isEnabled } = options

  const prevStatus = await getStatus({ db, where: { userId: sessionUserId } })
  if (prevStatus instanceof Error) {
    return prevStatus
  }

  const streamIdList = (prevStatus?.streamIdList?.slice() ?? []) as StreamId[]
  if (isEnabled) {
    if (!streamIdList.includes(streamId)) {
      streamIdList.push(streamId)
    }
  } else {
    streamIdList.splice(streamIdList.indexOf(streamId), 1)
  }

  const result = await upsertStatus({
    db,
    where: {
      userId: sessionUserId,
    },
    insert: {
      enabledAt: null,
      prompt: '',
      hash: '',
      status: '',
      emoji: '',
      expiresAt: null,
      streamIdList,
      messageLog: null,
    },
    update: {
      streamIdList,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default statusToggleStream
