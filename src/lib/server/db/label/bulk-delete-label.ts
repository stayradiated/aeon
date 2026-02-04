import { errorBoundary } from '@stayradiated/error-boundary'
import type { DeleteResult } from 'kysely'
import { sql } from 'kysely'

import type { LabelId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'

import { extendWhere } from '#lib/server/db/where.js'

type BulkDeleteLabelOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    labelId?: LabelId
  }>
}

const bulkDeleteLabel = async (
  options: BulkDeleteLabelOptions,
): Promise<DeleteResult | Error> => {
  const { db, where } = options

  return errorBoundary(async () => {
    let query = db.selectFrom('label').select('id')

    query = extendWhere(query)
      .string('id', where.labelId)
      .string('userId', where.userId)
      .done()

    const list = await query.execute()
    const labelIdList = list.map((row) => row.id)

    if (labelIdList.length === 0) {
      return { numDeletedRows: 0n } satisfies DeleteResult
    }

    await db
      .deleteFrom('labelParent')
      .where((eb) => eb('labelId', '=', eb.fn.any(sql.val(labelIdList))))
      .executeTakeFirstOrThrow()

    return db
      .deleteFrom('label')
      .where((eb) => eb('id', '=', eb.fn.any(sql.val(labelIdList))))
      .executeTakeFirstOrThrow()
  })
}

export { bulkDeleteLabel }
