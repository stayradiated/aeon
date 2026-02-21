import { errorBoundary } from '@stayradiated/error-boundary'
import { sql } from 'kysely'

import type { LabelId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

type GetLabelUsageListOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    labelId: {
      in: LabelId[]
    }
    point?: {
      startedAt: {
        gte: number
        lte: number
      }
    }
  }
}

type LabelUsage = {
  id: LabelId
  count: number
  maxStartedAt: number
}

const getLabelUsageList = async (
  options: GetLabelUsageListOptions,
): Promise<LabelUsage[] | Error> => {
  const { db, where } = options

  if (where.labelId.in.length === 0) {
    return []
  }

  return errorBoundary(() => {
    let query = db
      .selectFrom('point')
      .innerJoin('pointLabel', 'point.id', 'pointLabel.pointId')
      .innerJoin('label', 'pointLabel.labelId', 'label.id')
      .select((eb) => [
        'label.id',
        eb.fn.count<number>('point.id').as('count'),
        eb.fn.max('point.startedAt').as('maxStartedAt'),
      ])
      .where('point.userId', '=', where.userId)
      .where((eb) => eb('label.id', '=', eb.fn.any(sql.val(where.labelId.in))))
      .groupBy('label.id')

    if (where.point) {
      query = query
        .where('point.startedAt', '>=', where.point.startedAt.gte)
        .where('point.startedAt', '<', where.point.startedAt.lte)
    }

    return query.execute()
  })
}

export { getLabelUsageList }
