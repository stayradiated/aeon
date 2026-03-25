import { errorBoundary } from '@stayradiated/error-boundary'

import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Status } from '#lib/server/types.js'
import type { OmitTimestamps } from '#lib/utils/omit-timestamps.js'

type UpsertStatusOptions = {
  db: KyselyDb
  where: {
    userId: UserId
  }
  insert: Omit<OmitTimestamps<Status>, 'userId'>
  update: {
    enabledAt?: number | null
    prompt?: string
    streamIdList?: StreamId[]

    hash?: string
    status?: string
    emoji?: string
    expiresAt?: number | null

    messageLog?: Record<string, unknown>
  }
  now?: number
}

const upsertStatus = async (
  options: UpsertStatusOptions,
): Promise<Status | Error> => {
  const { db, where, insert, update, now = Date.now() } = options

  const value: Status = {
    ...insert,
    userId: where.userId,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('status')
      .values(value)
      .onConflict((oc) =>
        oc.column('userId').doUpdateSet({
          ...update,
          updatedAt: now,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertStatus }
