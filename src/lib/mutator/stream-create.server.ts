import type { ServerMutator } from './types.js'

import { getNextStreamSortOrder } from '#lib/server/db/stream/get-next-stream-sort-order.js'
import { insertStream } from '#lib/server/db/stream/insert-stream.js'

const stream_create: ServerMutator<'stream_create'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { streamId, name } = options

  const nextSortOrder = await getNextStreamSortOrder({
    db,
    where: {
      userId: sessionUserId,
    },
  })
  if (nextSortOrder instanceof Error) {
    return nextSortOrder
  }

  const stream = await insertStream({
    db,
    set: {
      id: streamId,
      userId: sessionUserId,
      name,
      sortOrder: nextSortOrder,
      parentId: null,
    },
  })
  if (stream instanceof Error) {
    return stream
  }
}

export default stream_create
