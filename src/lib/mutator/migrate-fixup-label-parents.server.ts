import type { ServerMutator } from './types.ts'

import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'

import { fixupLabelParents } from '#lib/server/migrate/fixup-label-parents.js'

const migrateFixuplabelParents: ServerMutator<
  'migrate_fixupLabelParents'
> = async (context, _options) => {
  const { db, sessionUserId } = context

  const streamList = await getStreamList({
    db,
    where: {
      userId: sessionUserId,
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
      userId: sessionUserId,
    })
    if (result instanceof Error) {
      console.error('fixupLabelParents error', result)
      return result
    }
  }
}

export default migrateFixuplabelParents
