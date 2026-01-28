import { assertOk } from '@stayradiated/error-boundary'
import { createFactory } from 'test-fixture-factory'

import type { LabelId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Point, Stream, User } from '#lib/server/types.js'

import { upsertPoint } from '#lib/server/db/point/upsert-point.js'

import { genId } from '#lib/utils/gen-id.js'

const pointFactory = createFactory<Point>('Point')
  .withContext<{
    db: KyselyDb
    user?: Pick<User, 'id'>
    stream?: Pick<Stream, 'id'>
  }>()
  .withSchema((f) => ({
    db: f.type<KyselyDb>().from('db'),
    userId: f.type<UserId>().maybeFrom('user', ({ user }) => user?.id),
    streamId: f
      .type<StreamId>()
      .maybeFrom('stream', ({ stream }) => stream?.id),
    startedAt: f.type<number>().default(() => Date.now()),
    description: f.type<string>().default(''),
    labelIdList: f.type<LabelId[]>().default([]),
  }))
  .fixture(async (attrs, use) => {
    const { db, userId, streamId, startedAt, description, labelIdList } = attrs

    const point = await upsertPoint({
      db,
      where: {
        userId,
        streamId,
        startedAt,
      },
      insert: {
        pointId: genId(),
      },
      set: {
        description,
        labelIdList,
      },
    })
    assertOk(point)

    await use(point)
  })

const useCreatePoint = pointFactory.useCreateValue
const usePoint = pointFactory.useValue

export { useCreatePoint, usePoint }
