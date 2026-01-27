import type { AnonStream } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const streamSetParent: LocalMutator<'stream_setParent'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { streamId, parentId } = options

  const key = Key.stream.encode(streamId)
  const stream = await tx.get<AnonStream>(key)
  if (!stream) {
    return new Error('Stream not found')
  }

  const value: AnonStream = {
    ...stream,
    parentId,
  }
  await tx.set(key, value)
}

export default streamSetParent
