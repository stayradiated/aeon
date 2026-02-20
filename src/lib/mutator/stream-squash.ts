import type { AnonStream } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const streamSquash: LocalMutator<'stream_squash'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { sourceStreamIdList, destinationStreamId } = options

  // validate that the destination is not in the source list
  if (sourceStreamIdList.includes(destinationStreamId)) {
    return new Error('Destination stream cannot be in source list')
  }

  const destinationKey = Key.stream.encode(destinationStreamId)
  const destinationStream = await tx.get<AnonStream>(destinationKey)
  if (!destinationStream) {
    return new Error(`Destination stream not found: ${destinationStreamId}`)
  }

  for (const sourceStreamId of sourceStreamIdList) {
    const sourceKey = Key.stream.encode(sourceStreamId)
    const sourceStream = await tx.get<AnonStream>(sourceKey)
    if (!sourceStream) {
      return new Error(`Source stream not found: ${sourceStreamId}`)
    }

    // remove the source stream
    await tx.del(sourceKey)
  }
}

export default streamSquash
