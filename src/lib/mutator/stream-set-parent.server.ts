import type { ServerMutator } from './types.ts'

import { updateStream } from '#lib/server/db/stream/update-stream.js'

const streamSetParent: ServerMutator<'stream_setParent'> = async (
  context,
  options,
) => {
  const { db } = context
  const { streamId, parentId } = options

  const result = await updateStream({
    db,
    where: {
      userId: context.sessionUserId,
      streamId,
    },
    set: {
      parentId,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default streamSetParent
