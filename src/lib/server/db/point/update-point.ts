import { sql } from 'kysely'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { RawPointLabel } from '#lib/server/types.js'

import { transact } from '#lib/server/db/transact.js'
import { extendWhere } from '#lib/server/db/where.js'

type UpdatePointOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    streamId?: StreamId
  }>
  set: {
    startedAt?: number
    description?: string
    labelIdList?: readonly LabelId[]
  }
  now?: number
}

const updatePoint = async (
  options: UpdatePointOptions,
): Promise<void | Error> => {
  const { db, where, set, now = Date.now() } = options

  return transact('updatePoint', db, async ({ db }) => {
    let query = db
      .updateTable('point')
      .set({
        startedAt: set.startedAt,
        description: set.description,
        updatedAt: now,
      })
      .returning(['id', 'streamId', 'userId'])

    query = extendWhere(query)
      .string('id', where.pointId)
      .string('userId', where.userId)
      .done()

    const updatedRowList = await query.execute()
    if (updatedRowList.length === 0) {
      // nothing more to do here
      return
    }

    if (typeof set.labelIdList !== 'undefined') {
      // remove duplicate labels, while preserving order
      const labelIdList = [...new Set(set.labelIdList)]

      const pointLabelList: RawPointLabel[] = updatedRowList.flatMap((point) =>
        labelIdList.map(
          (labelId): RawPointLabel => ({
            pointId: point.id,
            streamId: point.streamId,
            userId: point.userId,
            labelId,
            createdAt: now,
            updatedAt: now,
          }),
        ),
      )
      if (pointLabelList.length > 0) {
        await db
          .insertInto('pointLabel')
          .values(pointLabelList)
          .onConflict((oc) => oc.columns(['pointId', 'labelId']).doNothing())
          .execute()
      }

      const pointIdList = updatedRowList.map((point) => point.id)

      let deletePointLabelQuery = db
        .deleteFrom('pointLabel')
        .where('pointId', 'in', pointIdList)

      if (labelIdList.length > 0) {
        deletePointLabelQuery = deletePointLabelQuery.where(
          sql<boolean>`${sql.ref('labelId')} <> all(${sql.val(labelIdList)})`,
        )
      }

      await deletePointLabelQuery.execute()
    }
  })
}

export { updatePoint }
