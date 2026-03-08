import type { ServerMutator } from './types.js'

import { bulkDeleteStream } from '#lib/server/db/stream/bulk-delete-stream.js'

const streamDelete: ServerMutator<'stream_delete'> = async (
  context,
  options,
) => {
  const { db } = context
  const { streamId } = options

  const result = await bulkDeleteStream({
    db,
    where: {
      userId: context.sessionUserId,
      streamId,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default streamDelete
