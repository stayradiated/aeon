import { assertOk } from '@stayradiated/error-boundary'
import * as dateFns from 'date-fns'
import { test as anyTest } from 'vitest'

import { getActiveLineList } from '#lib/server/db/line/get-active-line-list.js'
import { getLineList } from '#lib/server/db/line/get-line-list.js'

import { useDb } from '#lib/test/use-db.js'
import { useCreateLabel } from '#lib/test/use-label.js'
import { useNow } from '#lib/test/use-now.js'
import { useCreatePoint } from '#lib/test/use-point.js'
import { useCreateStream } from '#lib/test/use-stream.js'
import { useUser } from '#lib/test/use-user.js'

import { serialiseLineList } from './serialise-line-list.js'

const test = anyTest.extend({
  stream: undefined,

  now: useNow({ now: 1774149342312 }),
  db: useDb(),
  user: useUser(),
  createStream: useCreateStream(),
  createLabel: useCreateLabel(),
  createPoint: useCreatePoint(),
})

test('serialiseLineList', async ({
  expect,
  now,
  db,
  user,
  createStream,
  createLabel,
  createPoint,
}) => {
  const streamA = await createStream({ name: 'Stream A' })
  const streamB = await createStream({ name: 'Stream B' })

  const labelA = await createLabel({ streamId: streamA.id, name: 'Label A' })
  const labelB = await createLabel({ streamId: streamA.id, name: 'Label B' })
  const labelC = await createLabel({ streamId: streamB.id, name: 'Label C' })
  const labelD = await createLabel({ streamId: streamB.id, name: 'Label D' })

  await createPoint({
    streamId: streamA.id,
    labelIdList: [labelA.id, labelB.id],
    description: 'Hello World',
    startedAt: dateFns.subMinutes(now, 15).getTime(),
  })
  await createPoint({
    streamId: streamB.id,
    labelIdList: [labelC.id, labelD.id],
    startedAt: dateFns.subMinutes(now, 10).getTime(),
  })

  await createPoint({
    streamId: streamA.id,
    labelIdList: [labelA.id],
    startedAt: dateFns.subMinutes(now, 5).getTime(),
  })
  await createPoint({
    streamId: streamB.id,
    labelIdList: [labelC.id],
    startedAt: dateFns.subMinutes(now, 2).getTime(),
  })

  const activeLineList = await getActiveLineList({
    db,
    where: { userId: user.id },
  })
  assertOk(activeLineList)

  const recentLineList = await getLineList({
    db,
    where: {
      userId: user.id,
      stoppedAt: { gte: 0 }, // is not null
    },
  })
  assertOk(recentLineList)

  const streamRecord = { [streamA.id]: streamA, [streamB.id]: streamB }
  const labelRecord = {
    [labelA.id]: labelA,
    [labelB.id]: labelB,
    [labelC.id]: labelC,
    [labelD.id]: labelD,
  }

  expect(
    serialiseLineList({
      activeLineList,
      recentLineList,
      streamRecord,
      labelRecord,
      now,
      timeZone: 'Australia/Melbourne',
    }),
  ).toMatchInlineSnapshot(`
    "# current status (Sun 14:15)
    - 14:10 +5m Stream A: Label A
    - 14:13 +2m Stream B: Label C

    # history
    - 14:05 +8m Stream B: Label C, Label D
    - 14:00 +10m Stream A: Label A, Label B [Hello World]"
  `)
})
