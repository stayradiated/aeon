import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { updateStream } from '#lib/server/db/stream/update-stream.js'

const streamRename: ServerMutator<'stream_rename'> = async (
  context,
  options,
) => {
  const { db } = context
  const { streamId, name } = options

  const result = await updateStream({
    db,
    where: {
      userId: context.sessionUserId,
      streamId,
    },
    set: {
      name,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: context.sessionUserId })
}

export default streamRename
