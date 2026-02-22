import { errorBoundary } from '@stayradiated/error-boundary'

import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Status } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetStatusListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
  }>
}

const getStatusList = async (
  options: GetStatusListOptions,
): Promise<Status[] | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('status').selectAll()

    query = extendWhere(query).string('userId', where.userId).done()

    return query.execute()
  })
}

export { getStatusList }
