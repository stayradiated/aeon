import type { AnonStream } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const streamSort: LocalMutator<'stream_sort'> = async (context, options) => {
  const { tx } = context
  const { streamId, delta } = options

  const streamList = await tx
    .scan<AnonStream>({ prefix: Key.stream.prefix() })
    .entries()
    .toArray()
  streamList.sort((a, b) => a[1].sortOrder - b[1].sortOrder)

  const streamKey = Key.stream.encode(streamId)
  const index = streamList.findIndex(([key]) => key === streamKey)
  if (index < 0) {
    throw new Error('Stream not found')
  }

  const newIndex = index + delta
  if (newIndex < 0 || newIndex >= streamList.length) {
    console.warn(
      `Next index ${newIndex} is out of bounds, Skipping stream sort`,
    )
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
    const [key, stream] = streamList[i]!
    if (stream.sortOrder === i) {
      continue
    }
    await tx.set(key, {
      ...stream,
      sortOrder: i,
    })
  }
}

export default streamSort
