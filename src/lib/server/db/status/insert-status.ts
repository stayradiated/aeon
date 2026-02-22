import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb } from '#lib/server/db/types.js'
import type { Status } from '#lib/server/types.js'
import type { OmitTimestamps } from '#lib/utils/omit-timestamps.js'

type InsertStatusOptions = {
  db: KyselyDb
  set: OmitTimestamps<Status>
  now?: number
}

const insertStatus = async (
  options: InsertStatusOptions,
): Promise<Status | Error> => {
  const { db, set, now = Date.now() } = options

  const value: Status = {
    ...set,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('status')
      .values(value)
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { insertStatus }
