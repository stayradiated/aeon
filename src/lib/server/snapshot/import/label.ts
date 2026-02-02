import { listOrError } from '@stayradiated/error-boundary'

import type { LabelId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Snapshot } from '#lib/server/snapshot/schema.js'
import type { IdMap } from '#lib/utils/map-and-resolve-id.js'

import { insertLabel } from '#lib/server/db/label/insert-label.js'

import { genId } from '#lib/utils/gen-id.js'
import { createIdMap, resolveId } from '#lib/utils/map-and-resolve-id.js'

type ImportLabelOptions = {
  db: KyselyDb
  snapshot: Snapshot
  userId: UserId
  streamIdMap: IdMap<StreamId>
}

const importLabelList = async (
  options: ImportLabelOptions,
): Promise<IdMap<LabelId> | Error> => {
  const { db, snapshot, userId, streamIdMap } = options

  const labelIdMap = createIdMap<LabelId>('Label')

  for (const label of snapshot.label) {
    const streamId = resolveId(streamIdMap, label.streamId)
    if (streamId instanceof Error) {
      return streamId
    }

    const parentLabelIdList = listOrError(
      label.parentLabelIdList.map((labelId) => resolveId(labelIdMap, labelId)),
    )
    if (parentLabelIdList instanceof Error) {
      return parentLabelIdList
    }

    const insertedLabel = await insertLabel({
      db,
      set: {
        ...label,
        id: genId(),
        userId,
        parentLabelIdList,
        streamId,
      },
    })
    if (insertedLabel instanceof Error) {
      return insertedLabel
    }

    labelIdMap.set(label.id, insertedLabel.id)
  }

  return labelIdMap
}

export { importLabelList }
