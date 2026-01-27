import type { AnonStream } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const streamRename: LocalMutator<'stream_rename'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { streamId, name } = options

  const key = Key.stream.encode(streamId)
  const stream = await tx.get<AnonStream>(key)
  if (!stream) {
    return new Error('Stream not found')
  }

  const value: AnonStream = {
    ...stream,
    name,
  }
  await tx.set(key, value)
}

export default streamRename
