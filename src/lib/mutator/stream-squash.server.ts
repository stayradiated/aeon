import { listOrError } from '@stayradiated/error-boundary'

import type { StreamId } from '#lib/ids.js'
import type { Stream } from '#lib/server/types.js'
import type { ServerMutator } from './types.ts'

import { bulkDeleteLabel } from '#lib/server/db/label/bulk-delete-label.js'
import { bulkDeletePoint } from '#lib/server/db/point/bulk-delete-point.js'
import { bulkDeleteStream } from '#lib/server/db/stream/bulk-delete-stream.js'
import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'
import { mergeStreamsIntoDestination } from '#lib/server/db/stream/merge-streams-into-destination.js'

const streamSquash: ServerMutator<'stream_squash'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { sourceStreamIdList, destinationStreamId } = options

  // validate that the destination is not in the source list
  if (sourceStreamIdList.includes(destinationStreamId)) {
    return new Error('Destination stream cannot be in source list')
  }

  // read all streams from the source and destination
  const streamList = await getStreamList({
    db,
    where: {
      streamId: { in: [destinationStreamId, ...sourceStreamIdList] },
      userId: sessionUserId,
    },
  })
  if (streamList instanceof Error) {
    return streamList
  }
  const streamRecord: Record<StreamId, Stream> = Object.fromEntries(
    streamList.map((stream) => [stream.id, stream]),
  )

  const destinationStream = streamRecord[destinationStreamId]
  if (!destinationStream) {
    return new Error(`Destination stream not found: ${destinationStreamId}`)
  }

  const sourceStreamList = listOrError(
    sourceStreamIdList.map((streamId) => {
      const stream = streamRecord[streamId]
      if (!stream) {
        return new Error(`Source stream not found: ${streamId}`)
      }
      return stream
    }),
  )
  if (sourceStreamList instanceof Error) {
    return sourceStreamList
  }

  /*
   * Merge Streams into Destination
   * ===========================================================================
   * This copies all points and labels from the source streams into the
   * destination stream (overwriting any existing points or labels).
   *
   * It does not mutate any data in the source streams.
   */

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: sessionUserId,
      destinationStreamId,
      sourceStreamIdList,
    },
  })
  if (result instanceof Error) {
    return result
  }

  /*
   * Delete Source Streams
   * ===========================================================================
   */

  // delete points
  const deletePointResult = await bulkDeletePoint({
    db,
    where: {
      userId: sessionUserId,
      streamId: { in: sourceStreamIdList },
    },
  })
  if (deletePointResult instanceof Error) {
    return new Error('Failed to delete point', { cause: deletePointResult })
  }

  // delete labels
  const deleteLabelResult = await bulkDeleteLabel({
    db,
    where: {
      userId: sessionUserId,
      streamId: { in: sourceStreamIdList },
    },
  })
  if (deleteLabelResult instanceof Error) {
    return new Error('Failed to delete label', { cause: deleteLabelResult })
  }

  // delete the source streams
  const deleteStreamResult = await bulkDeleteStream({
    db,
    where: {
      userId: sessionUserId,
      streamId: { in: sourceStreamIdList },
    },
  })
  if (deleteStreamResult instanceof Error) {
    return new Error('Failed to delete stream', { cause: deleteStreamResult })
  }
}

export default streamSquash
