import { errorBoundary } from '@stayradiated/error-boundary'

import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Status } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetStatusOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
  }>
}

const getStatus = async (
  options: GetStatusOptions,
): Promise<Status | undefined | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let query = db.selectFrom('status').selectAll()

    query = extendWhere(query).string('userId', where.userId).done()

    return query.executeTakeFirst()
  })
}

export { getStatus }
