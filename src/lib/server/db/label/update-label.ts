import { sql } from 'kysely'

import type { LabelId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label, RawLabelParent } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'

type UpdateLabelOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    labelId: LabelId
  }
  set: Partial<
    Pick<Label, 'streamId' | 'name' | 'color' | 'icon' | 'parentLabelIdList'>
  >
  now?: number
}

const updateLabel = async (
  options: UpdateLabelOptions,
): Promise<void | Error> => {
  const { db, where, set, now = Date.now() } = options

  return transact('updateLabel', db, async ({ db }) => {
    /*
     * note: eevn if there are no properties to update, we still need to
     * update the timestamps - to ensure that the row is marked as changed
     * so that the replicache CVR is updated on the next pull
     */
    await db
      .updateTable('label')
      .set({
        name: set.name,
        color: set.color,
        icon: set.icon,
        updatedAt: now,
      })
      .where('id', '=', where.labelId)
      .where('userId', '=', where.userId)
      .execute()

    if (Array.isArray(set.parentLabelIdList)) {
      // upsert new labelParent rows (if there are any)
      if (set.parentLabelIdList.length > 0) {
        const labelParentList = set.parentLabelIdList.map(
          (parentLabelId): RawLabelParent => ({
            labelId: where.labelId,
            parentLabelId,
            userId: where.userId,
            createdAt: now,
            updatedAt: now,
          }),
        )

        await db
          .insertInto('labelParent')
          .values(labelParentList)
          .onConflict((oc) =>
            oc.columns(['labelId', 'parentLabelId']).doNothing(),
          )
          .execute()
      }

      // delete any existing labelParent rows that are not in the new list
      let deleteLabelParentQuery = db
        .deleteFrom('labelParent')
        .where('labelId', '=', where.labelId)

      // only exclude the parent label if there are any
      if (set.parentLabelIdList.length > 0) {
        deleteLabelParentQuery = deleteLabelParentQuery.where(
          sql<boolean>`${sql.ref('parentLabelId')} <> all(${sql.val(set.parentLabelIdList)})`,
        )
      }

      await deleteLabelParentQuery.execute()
    }
  })
}

export { updateLabel }
