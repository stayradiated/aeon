import { errorBoundary } from '@stayradiated/error-boundary'

import type { LabelId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { RawLabelParent } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetLabelParentListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    labelId?: LabelId
    parentLabelId?: LabelId
  }>
}

const getLabelParentList = async (
  options: GetLabelParentListOptions,
): Promise<RawLabelParent[] | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('labelParent').selectAll()

    query = extendWhere(query)
      .string('userId', where.userId)
      .string('labelId', where.labelId)
      .string('parentLabelId', where.parentLabelId)
      .done()

    return query.execute()
  })
}

export { getLabelParentList }
