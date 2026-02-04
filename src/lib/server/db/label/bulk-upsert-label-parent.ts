import type { KyselyDb } from '#lib/server/db/types.js'
import type { RawLabelParent } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'

type BulkUpsertLabelParentOptions = {
  db: KyselyDb
  values: Pick<RawLabelParent, 'labelId' | 'parentLabelId' | 'userId'>[]
  now?: number
}

const bulkUpsertLabelParent = async (
  options: BulkUpsertLabelParentOptions,
): Promise<void | Error> => {
  const { db, values, now = Date.now() } = options

  return transact('updateLabelParent', db, async ({ db }) => {
    const updatedRow = await db
      .insertInto('labelParent')
      .values(
        values.map((row) => ({
          labelId: row.labelId,
          userId: row.userId,
          parentLabelId: row.parentLabelId,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflict((oc) => oc.columns(['labelId', 'parentLabelId']).doNothing())
      .returning('labelId')
      .executeTakeFirst()

    // if the labelParent was inserted, then update the label
    // critical for replicache CVR to detect changes
    if (updatedRow) {
      await db
        .updateTable('label')
        .set({
          updatedAt: now,
        })
        .where('id', '=', updatedRow.labelId)
        .execute()
    }
  })
}

export { bulkUpsertLabelParent }
