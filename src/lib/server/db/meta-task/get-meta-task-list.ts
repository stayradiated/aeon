import { errorBoundary } from '@stayradiated/error-boundary'

import type { MetaTaskId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { MetaTask } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetMetaTaskListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    metaTaskId?: MetaTaskId
  }>
}

const getMetaTaskList = async (
  options: GetMetaTaskListOptions,
): Promise<MetaTask[] | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('metaTask').selectAll()

    query = extendWhere(query)
      .string('id', where.metaTaskId)
      .string('userId', where.userId)
      .done()

    return query.execute()
  })
}

export { getMetaTaskList }
