import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label, RawLabel, RawLabelParent } from '#lib/server/types.js'
import type { OmitTimestamps } from '#lib/utils/omit-timestamps.js'

import { transact } from '#lib/server/db/transact.js'

type BulkInsertLabelOptions = {
  db: KyselyDb
  list: OmitTimestamps<Label>[]
  now?: number
}

const bulkInsertLabel = async (
  options: BulkInsertLabelOptions,
): Promise<Label[] | Error> => {
  const { db, list, now = Date.now() } = options

  if (list.length === 0) {
    return []
  }

  const labelValueList: RawLabel[] = []
  const labelParentList: RawLabelParent[] = []
  const inserted: Label[] = []

  for (const item of list) {
    const value: RawLabel = {
      id: item.id,
      userId: item.userId,
      streamId: item.streamId,
      name: item.name,
      icon: item.icon,
      color: item.color,
      createdAt: now,
      updatedAt: now,
    }
    labelValueList.push(value)

    for (const parentLabelId of item.parentLabelIdList) {
      labelParentList.push({
        labelId: value.id,
        parentLabelId,
        userId: item.userId,
        createdAt: now,
        updatedAt: now,
      })
    }

    inserted.push({
      ...value,
      parentLabelIdList: item.parentLabelIdList,
    })
  }

  return transact('bulkInsertLabel', db, async ({ db }) => {
    await db
      .insertInto('label')
      .values(labelValueList)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (labelParentList.length > 0) {
      await db.insertInto('labelParent').values(labelParentList).execute()
    }

    // return the inserted labels
    // (not actually re-querying, but assuming everything is correct)
    return inserted
  })
}

export { bulkInsertLabel }
