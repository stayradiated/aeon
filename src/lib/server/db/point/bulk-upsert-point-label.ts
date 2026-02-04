import type { KyselyDb } from '#lib/server/db/types.js'
import type { RawPointLabel } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'

type BulkUpsertPointLabelOptions = {
  db: KyselyDb
  values: Pick<RawPointLabel, 'pointId' | 'labelId' | 'streamId' | 'userId'>[]
  now?: number
}

const bulkUpsertPointLabel = async (
  options: BulkUpsertPointLabelOptions,
): Promise<void | Error> => {
  const { db, values, now = Date.now() } = options

  return transact('updatePointLabel', db, async ({ db }) => {
    const updatedRow = await db
      .insertInto('pointLabel')
      .values(
        values.map((row) => ({
          pointId: row.pointId,
          labelId: row.labelId,
          streamId: row.streamId,
          userId: row.userId,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflict((oc) => oc.columns(['pointId', 'labelId']).doNothing())
      .returning('pointId')
      .executeTakeFirst()

    // if the pointLabel was inserted, then update the point
    // critical for replicache CVR to detect changes
    if (updatedRow) {
      await db
        .updateTable('point')
        .set({
          updatedAt: now,
        })
        .where('id', '=', updatedRow.pointId)
        .execute()
    }
  })
}

export { bulkUpsertPointLabel }
