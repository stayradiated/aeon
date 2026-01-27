import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'

import { trackMetaTask } from '#lib/server/meta-task/track-meta-task.js'

import { fixupLabelParents } from './fixup-label-parents.js'

type FixupAllLabelParentsOptions = {
  db: KyselyDb
  userId: UserId
}

const fixupAllLabelParents = async (
  options: FixupAllLabelParentsOptions,
): Promise<void | Error> => {
  const { db, userId } = options

  await using metaTask = await trackMetaTask({
    db,
    userId,
    name: 'fixup-all-label-parents',
  })

  const streamList = await getStreamList({
    db,
    where: {
      userId,
    },
  })
  if (streamList instanceof Error) {
    return streamList
  }

  for (const stream of streamList) {
    if (!stream.parentId) {
      // ignore streams without a parent
      continue
    }
    const result = await fixupLabelParents({
      db,
      streamId: stream.id,
      parentStreamId: stream.parentId,
      userId,
    })
    if (result instanceof Error) {
      console.error('fixupLabelParents error', result)
      return result
    }
  }

  metaTask.complete()
}

export { fixupAllLabelParents }
