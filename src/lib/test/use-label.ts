import { assertOk } from '@stayradiated/error-boundary'
import { createFactory } from 'test-fixture-factory'

import type { LabelId, StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label, Stream, User } from '#lib/server/types.js'

import { insertLabel } from '#lib/server/db/label/insert-label.js'

import { genId } from '#lib/utils/gen-id.js'

const labelFactory = createFactory<Label>('Label')
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
    name: f.type<string>().default('Untitled'),
    parentLabelIdList: f.type<LabelId[]>().default([]),
    icon: f.type<string | null>().default(null),
    color: f.type<string | null>().default(null),
  }))
  .fixture(async (attrs, use) => {
    const { db, userId, name, parentLabelIdList, streamId, icon, color } = attrs

    const label = await insertLabel({
      db,
      set: {
        id: genId(),
        userId,
        name,
        parentLabelIdList,
        streamId,
        icon,
        color,
      },
    })
    assertOk(label)

    await use(label)
  })

const useCreateLabel = labelFactory.useCreateValue
const useLabel = labelFactory.useValue

export { useCreateLabel, useLabel }
