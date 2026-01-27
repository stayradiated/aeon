import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Snapshot } from './schema.js'

import { trackMetaTask } from '#lib/server/meta-task/track-meta-task.js'

import { importLabelList } from './import/label.js'
import { importPointList } from './import/point.js'
import { importStreamList } from './import/stream.js'

type ImportSnapshotOptions = {
  db: KyselyDb
  userId: UserId
  snapshot: Snapshot
}

const importSnapshot = async (
  options: ImportSnapshotOptions,
): Promise<void | Error> => {
  const { db, userId, snapshot } = options

  await using metaTask = await trackMetaTask({
    db,
    userId,
    name: 'import-snapshot',
  })

  // Note: Order is very important here

  const streamIdMap = await importStreamList({
    db,
    snapshot,
    userId,
  })
  if (streamIdMap instanceof Error) {
    return new Error('Could not importStreams', { cause: streamIdMap })
  }

  const labelIdMap = await importLabelList({
    db,
    snapshot,
    userId,
    streamIdMap,
  })
  if (labelIdMap instanceof Error) {
    return new Error('Could not importLabels', { cause: labelIdMap })
  }

  const pointIdMap = await importPointList({
    db,
    snapshot,
    userId,
    streamIdMap,
    labelIdMap,
  })
  if (pointIdMap instanceof Error) {
    return new Error('Could not importPoints', { cause: pointIdMap })
  }

  await metaTask.complete()

  return undefined
}

export { importSnapshot }
