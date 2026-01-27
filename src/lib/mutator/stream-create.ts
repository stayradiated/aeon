import type { AnonStream } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const streamCreate: LocalMutator<'stream_create'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { streamId, name } = options

  let maxSortOrder = 0
  for await (const stream of tx
    .scan<AnonStream>({ prefix: Key.stream.prefix() })
    .values()) {
    if (stream.sortOrder > maxSortOrder) {
      maxSortOrder = stream.sortOrder
    }
  }
  const nextSortOrder = maxSortOrder + 1

  const key = Key.stream.encode(streamId)
  const value: AnonStream = {
    name,
    parentId: undefined,
    sortOrder: nextSortOrder,
  }
  await tx.set(key, value)
}

export default streamCreate
