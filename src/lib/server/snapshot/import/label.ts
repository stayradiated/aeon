import { listOrError } from '@stayradiated/error-boundary'

import type { LabelId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Snapshot } from '#lib/server/snapshot/schema.js'
import type { IdMap } from '#lib/utils/map-and-resolve-id.js'

import { insertLabel } from '#lib/server/db/label/insert-label.js'

import { genId } from '#lib/utils/gen-id.js'
import { createIdMap, resolveId } from '#lib/utils/map-and-resolve-id.js'
import { topoSortParentsFirst } from '#lib/utils/topo-sort-parents-first.js'

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

  /*
   * sort parents first
   * so we always insert parents before children
   * and thus children can always resolve their parent IDs
   */
  const sortedLabelList = topoSortParentsFirst({
    items: snapshot.label,
    getId: (label) => label.id,
    getParentIdList: (label) => label.parentLabelIdList,
  })
  if (sortedLabelList instanceof Error) {
    return new Error('Could not sort label list', { cause: sortedLabelList })
  }

  for (const label of sortedLabelList) {
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
