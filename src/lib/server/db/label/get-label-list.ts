import { errorBoundary } from '@stayradiated/error-boundary'

import type { LabelId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Label } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetLabelListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    labelId?: LabelId
    streamId?: StreamId
  }>
}

const getLabelList = async (
  options: GetLabelListOptions,
): Promise<Label[] | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('labelWithParentList').selectAll()

    query = extendWhere(query)
      .string('id', where.labelId)
      .string('userId', where.userId)
      .string('streamId', where.streamId)
      .done()

    return query.execute()
  })
}

export { getLabelList }
