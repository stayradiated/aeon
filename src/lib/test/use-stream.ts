import { assertOk } from '@stayradiated/error-boundary'
import { createFactory } from 'test-fixture-factory'

import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Stream, User } from '#lib/server/types.js'

import { getNextStreamSortOrder } from '#lib/server/db/stream/get-next-stream-sort-order.js'
import { insertStream } from '#lib/server/db/stream/insert-stream.js'

import { genId } from '#lib/utils/gen-id.js'

const streamFactory = createFactory<Stream>('Stream')
  .withContext<{
    db: KyselyDb
    user?: Pick<User, 'id'>
  }>()
  .withSchema((f) => ({
    db: f.type<KyselyDb>().from('db'),
    userId: f.type<UserId>().maybeFrom('user', ({ user }) => user?.id),
    name: f.type<string>().default('Untitled'),
    parentId: f.type<StreamId | null>().default(null),
    sortOrder: f.type<number>().optional(),
  }))
  .fixture(async (attrs, use) => {
    const { db, userId, name, parentId } = attrs

    let sortOrder = attrs.sortOrder
    if (!sortOrder) {
      const nextSortOrder = await getNextStreamSortOrder({
        db,
        where: { userId },
      })
      if (nextSortOrder instanceof Error) {
        throw nextSortOrder
      }
      sortOrder = nextSortOrder
    }

    const stream = await insertStream({
      db,
      set: {
        id: genId(),
        userId,
        name,
        parentId,
        sortOrder,
      },
    })
    assertOk(stream)

    await use(stream)
  })

const useCreateStream = streamFactory.useCreateValue
const useStream = streamFactory.useValue

export { useCreateStream, useStream }
