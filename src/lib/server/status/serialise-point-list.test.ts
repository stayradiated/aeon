import { test as anyTest } from 'vitest'

import { useDb } from '#lib/test/use-db.js'
import { useCreateLabel } from '#lib/test/use-label.js'
import { useCreatePoint } from '#lib/test/use-point.js'
import { useCreateStream } from '#lib/test/use-stream.js'
import { useUser } from '#lib/test/use-user.js'

import { serialisePointList } from './serialise-point-list.js'

const test = anyTest.extend({
  db: useDb(),
  user: useUser(),
  createStream: useCreateStream(),
  createLabel: useCreateLabel(),
  createPoint: useCreatePoint(),
})

test('serialisePointList', async ({
  expect,
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

  const pointA = await createPoint({
    streamId: streamA.id,
    labelIdList: [labelA.id, labelB.id],
    description: 'Hello World',
  })
  const pointB = await createPoint({
    streamId: streamB.id,
    labelIdList: [labelC.id, labelD.id],
  })

  const pointList = [pointA, pointB]
  const streamRecord = { [streamA.id]: streamA, [streamB.id]: streamB }
  const labelRecord = {
    [labelA.id]: labelA,
    [labelB.id]: labelB,
    [labelC.id]: labelC,
    [labelD.id]: labelD,
  }

  expect(
    serialisePointList({ pointList, streamRecord, labelRecord }),
  ).toMatchInlineSnapshot(`
    "- Stream A: Label A, Label B [Hello World]
    - Stream B: Label C, Label D"
  `)
})
