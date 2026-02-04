import type { LabelId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'

import { transact } from '#lib/server/db/transact.js'
import { extendWhere } from '#lib/server/db/where.js'

type BulkDeleteLabelParentOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    labelId?: LabelId
    parentLabelId?: LabelId
  }>
  now?: number
}

const bulkDeleteLabelParent = async (
  options: BulkDeleteLabelParentOptions,
): Promise<void | Error> => {
  const { db, where, now = Date.now() } = options

  return transact('bulkDeleteLabelParents', db, async ({ db }) => {
    let query = db.deleteFrom('labelParent').returning('labelId')

    query = extendWhere(query)
      .string('labelId', where.labelId)
      .string('parentLabelId', where.parentLabelId)
      .string('userId', where.userId)
      .done()

    const deletedRowList = await query.execute()

    // bump all points that were updated
    // critical for replicache CVR to detect changes
    const labelIdSet = new Set(deletedRowList.map((row) => row.labelId))
    if (labelIdSet.size > 0) {
      await db
        .updateTable('label')
        .set({
          updatedAt: now,
        })
        .where('id', 'in', Array.from(labelIdSet))
        .execute()
    }
  })
}

export { bulkDeleteLabelParent }
