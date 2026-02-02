import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label, RawLabel, RawLabelParent } from '#lib/server/types.js'
import type { OmitTimestamps } from '#lib/utils/omit-timestamps.js'

import { transact } from '#lib/server/db/transact.js'

type InsertLabelOptions = {
  db: KyselyDb
  set: OmitTimestamps<Label>
  now?: number
}

const insertLabel = async (
  options: InsertLabelOptions,
): Promise<Label | Error> => {
  const { db, set, now = Date.now() } = options

  const value: RawLabel = {
    id: set.id,
    userId: set.userId,
    streamId: set.streamId,
    name: set.name,
    icon: set.icon,
    color: set.color,
    createdAt: now,
    updatedAt: now,
  }

  const labelParentList = set.parentLabelIdList.map(
    (parentLabelId): RawLabelParent => ({
      labelId: value.id,
      parentLabelId,
      userId: set.userId,
      createdAt: now,
      updatedAt: now,
    }),
  )

  return transact('insertLabel', db, async () => {
    await db
      .insertInto('label')
      .values(value)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (labelParentList.length > 0) {
      await db.insertInto('labelParent').values(labelParentList).execute()
    }

    // save a query by assuming everything is correct
    const label: Label = {
      ...value,
      parentLabelIdList: set.parentLabelIdList,
    }
    return label
  })
}

export { insertLabel }
