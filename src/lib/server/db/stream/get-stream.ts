import { errorBoundary } from '@stayradiated/error-boundary'

import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Stream } from '#lib/server/types.js'

import { extendWhere } from '#lib/server/db/where.js'

type GetStreamListOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    streamId?: StreamId
    name?: string
  }>
}

const getStream = async (
  options: GetStreamListOptions,
): Promise<Stream | undefined | Error> => {
  const { db, where } = options

  const stream = await errorBoundary(() => {
    let query = db.selectFrom('stream').selectAll().orderBy('sortOrder', 'asc')

    query = extendWhere(query)
      .string('id', where.streamId)
      .string('userId', where.userId)
      .string('name', where.name)
      .done()

    return query.executeTakeFirst()
  })
  return stream
}

export { getStream }
