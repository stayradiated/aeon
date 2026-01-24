import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Where } from '#lib/server/db/where.js'
import type { Point } from '#lib/server/types.js'

import { getPointList } from './get-point-list.js'

type GetPointIteratorOptions = {
  db: KyselyDb
  where: Where<{
    userId: UserId
    streamId: StreamId
  }>
  pageSize?: number
}

async function* getPointIterator(options: GetPointIteratorOptions) {
  const { db, where, pageSize = 100 } = options

  let pointer: Point | undefined

  while (true) {
    const pointList = await getPointList({
      db,
      where,
      paginate: {
        pointer,
        limit: pageSize,
      },
    })
    if (pointList instanceof Error) {
      yield pointList
      return
    }
    const hasMore = pointList.length === pageSize

    for (const point of pointList) {
      yield point
    }

    pointer = pointList.at(-1)
    if (!hasMore) {
      break
    }
  }
}

export { getPointIterator }
