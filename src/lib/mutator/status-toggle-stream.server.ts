import type { StreamId } from '#lib/ids.js'
import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { getStatus } from '#lib/server/db/status/get-status.js'
import { insertStatus } from '#lib/server/db/status/insert-status.js'
import { updateStatus } from '#lib/server/db/status/update-status.js'

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

  if (!prevStatus) {
    const result = await insertStatus({
      db,
      set: {
        enabledAt: null,
        userId: sessionUserId,
        prompt: '',
        hash: '',
        status: '',
        emoji: '',
        expiresAt: null,
        streamIdList,
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
        streamIdList,
      },
    })
    if (result instanceof Error) {
      return result
    }
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default statusToggleStream
