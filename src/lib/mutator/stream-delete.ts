import type { LocalMutator } from './types.js'

import * as Key from '#lib/core/replicache/keys.js'

const streamDelete: LocalMutator<'stream_delete'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { streamId } = options

  const key = Key.stream.encode(streamId)
  await tx.del(key)
}

export default streamDelete
