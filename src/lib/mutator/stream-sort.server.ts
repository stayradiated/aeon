import type { ServerMutator } from './types.ts'

import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'
import { updateStream } from '#lib/server/db/stream/update-stream.js'

const streamSort: ServerMutator<'stream_sort'> = async (context, options) => {
  const { db, sessionUserId } = context
  const { streamId, delta } = options

  const streamList = await getStreamList({
    db,
    where: { userId: sessionUserId },
  })
  if (streamList instanceof Error) {
    return streamList
  }

  const index = streamList.findIndex((stream) => stream.id === streamId)
  if (index < 0) {
    return new Error('Stream not found')
  }

  // move the stream to the new index
  const newIndex = index + delta
  if (newIndex < 0 || newIndex >= streamList.length) {
    return
  }

  ;[streamList[index], streamList[newIndex]] = [
    // biome-ignore lint/style/noNonNullAssertion: this is fine
    streamList[newIndex]!,
    // biome-ignore lint/style/noNonNullAssertion: this is fine
    streamList[index]!,
  ]

  for (let i = 0; i < streamList.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: this is fine
    const stream = streamList[i]!
    if (stream.sortOrder === i) {
      continue
    }
    const result = await updateStream({
      db,
      where: {
        userId: sessionUserId,
        streamId: stream.id,
      },
      set: {
        sortOrder: i,
      },
    })
    if (result instanceof Error) {
      return result
    }
  }
}

export default streamSort
