import { errorBoundary } from '@stayradiated/error-boundary'
import type { DeleteResult } from 'kysely'
import { sql } from 'kysely'

import type { PointId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'

import { extendWhere } from '#lib/server/db/where.js'

type BulkDeletePointOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    pointId?: PointId
    streamId?: StreamId
  }>
}

const bulkDeletePoint = async (
  options: BulkDeletePointOptions,
): Promise<DeleteResult | Error> => {
  const { db, where } = options

  return errorBoundary(async () => {
    let query = db.selectFrom('point').select('id')

    query = extendWhere(query)
      .string('id', where.pointId)
      .string('userId', where.userId)
      .string('streamId', where.streamId)
      .done()

    const list = await query.execute()

    const pointIdList = list.map((row) => row.id)

    if (pointIdList.length === 0) {
      return { numDeletedRows: 0n } satisfies DeleteResult
    }

    await db
      .deleteFrom('pointLabel')
      .where((eb) => eb('pointId', '=', eb.fn.any(sql.val(pointIdList))))
      .executeTakeFirstOrThrow()

    return db
      .deleteFrom('point')
      .where((eb) => eb('id', '=', eb.fn.any(sql.val(pointIdList))))
      .executeTakeFirstOrThrow()
  })
}

export { bulkDeletePoint }
