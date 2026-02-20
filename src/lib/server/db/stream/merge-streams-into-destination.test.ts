import { assertError, assertOk } from '@stayradiated/error-boundary'
import { test as anyTest } from 'vitest'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getPointList } from '#lib/server/db/point/get-point-list.js'

import { useDb } from '#lib/test/use-db.js'
import { useCreateLabel } from '#lib/test/use-label.js'
import { useNow } from '#lib/test/use-now.js'
import { useCreatePoint } from '#lib/test/use-point.js'
import { useCreateStream, useStream } from '#lib/test/use-stream.js'
import { useUser } from '#lib/test/use-user.js'

import { mergeStreamsIntoDestination } from './merge-streams-into-destination.js'

const test = anyTest.extend({
  db: useDb(),
  now: useNow(),
  user: useUser(),
  srcStream: useStream(),
  destStream: useStream(),
  createStream: useCreateStream(),
  createLabel: useCreateLabel(),
  createPoint: useCreatePoint(),
})

test('[validation] abort if src stream == dst stream', async ({
  expect,
  db,
  user,
  srcStream,
}) => {
  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: srcStream.id,
      sourceStreamIdList: [srcStream.id],
    },
  })
  assertError(result)
  expect(result.message).toMatchInlineSnapshot(
    `"Destination stream cannot be in source list"`,
  )
})

test('[sanity] when src streams are empty', async ({
  expect,
  db,
  user,
  srcStream,
  destStream,
}) => {
  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
  })
  assertOk(result)
  expect(result).toMatchObject({
    insertedLabelCount: 0,
    upsertedPointCount: 0,
  })
})

test('[sanity] do not mutate src labels', async ({
  expect,
  db,
  user,
  srcStream,
  destStream,
  createLabel,
}) => {
  const label = await createLabel({ streamId: srcStream.id })

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 1,
    upsertedPointCount: 0,
  })

  const srcLabelList = await getLabelList({
    db,
    where: {
      userId: user.id,
      streamId: srcStream.id,
    },
  })
  assertOk(srcLabelList)

  expect(srcLabelList).toStrictEqual([label])
})

test('[basic] recreate labels in destination stream', async ({
  expect,
  now,
  db,
  user,
  srcStream,
  destStream,
  createLabel,
}) => {
  const fruit = await createLabel({ streamId: srcStream.id, name: 'Fruit' })

  await Promise.all([
    createLabel({
      streamId: srcStream.id,
      name: 'A',
      icon: '🍏',
      color: 'green',
      parentLabelIdList: [fruit.id],
    }),
    createLabel({
      streamId: srcStream.id,
      name: 'B',
      icon: '🍌',
      color: 'yellow',
      parentLabelIdList: [fruit.id],
    }),
    createLabel({
      streamId: srcStream.id,
      name: 'C',
      icon: '🍒',
      color: 'red',
      parentLabelIdList: [fruit.id],
    }),
  ])

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
    now,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 4,
    upsertedPointCount: 0,
  })

  const destLabelList = await getLabelList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destLabelList)

  // the labels should be in the same order as the source labels
  destLabelList.sort((a, b) => a.name.localeCompare(b.name))

  expect(destLabelList).toStrictEqual([
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      parentLabelIdList: [fruit.id],
      name: 'A',
      color: 'green',
      icon: '🍏',
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      parentLabelIdList: [fruit.id],
      name: 'B',
      color: 'yellow',
      icon: '🍌',
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      parentLabelIdList: [fruit.id],
      name: 'C',
      color: 'red',
      icon: '🍒',
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      parentLabelIdList: [],
      name: 'Fruit',
      color: null,
      icon: null,
      streamId: destStream.id,
      userId: user.id,
    },
  ])
})

test('[sanity] do not mutate src points', async ({
  expect,
  db,
  user,
  srcStream,
  destStream,
  createPoint,
}) => {
  const point = await createPoint({ streamId: srcStream.id })

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 0,
    upsertedPointCount: 1,
  })

  const srcPointList = await getPointList({
    db,
    where: {
      userId: user.id,
      streamId: srcStream.id,
    },
  })
  assertOk(srcPointList)

  expect(srcPointList).toStrictEqual([point])
})

test('[basic] insert unlabeled points in destination stream', async ({
  expect,
  now,
  db,
  user,
  srcStream,
  destStream,
  createPoint,
}) => {
  await Promise.all([
    createPoint({
      streamId: srcStream.id,
      startedAt: now + 1,
      description: 'A',
    }),
    createPoint({
      streamId: srcStream.id,
      startedAt: now + 2,
      description: 'B',
    }),
    createPoint({
      streamId: srcStream.id,
      startedAt: now + 3,
      description: 'C',
    }),
  ])

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
    now,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 0,
    upsertedPointCount: 3,
  })

  const destPointList = await getPointList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destPointList)

  // the points should be in the same order as the source points
  destPointList.sort((a, b) => a.startedAt - b.startedAt)

  expect(destPointList).toStrictEqual([
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      description: 'A',
      labelIdList: [],
      startedAt: now + 1,
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      description: 'B',
      labelIdList: [],
      startedAt: now + 2,
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      description: 'C',
      labelIdList: [],
      startedAt: now + 3,
      streamId: destStream.id,
      userId: user.id,
    },
  ])
})

test('[basic] insert labeled points in destination stream', async ({
  expect,
  now,
  db,
  user,
  srcStream,
  destStream,
  createPoint,
  createLabel,
}) => {
  const apple = await createLabel({ streamId: srcStream.id, name: 'Apple' })
  const orange = await createLabel({ streamId: srcStream.id, name: 'Orange' })

  await Promise.all([
    createPoint({
      streamId: srcStream.id,
      startedAt: now + 1,
      description: 'A',
      labelIdList: [apple.id],
    }),
    createPoint({
      streamId: srcStream.id,
      startedAt: now + 2,
      description: 'B',
      labelIdList: [orange.id],
    }),
    createPoint({
      streamId: srcStream.id,
      startedAt: now + 3,
      description: 'C',
      labelIdList: [apple.id, orange.id],
    }),
  ])

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
    now,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 2,
    upsertedPointCount: 3,
  })

  const destLabelList = await getLabelList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destLabelList)

  const destApple = destLabelList.find((label) => label.name === 'Apple')
  if (!destApple) {
    throw expect.fail('Apple label not found')
  }

  const destOrange = destLabelList.find((label) => label.name === 'Orange')
  if (!destOrange) {
    throw expect.fail('Orange label not found')
  }

  const destPointList = await getPointList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destPointList)

  expect(destPointList).toStrictEqual([
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      description: 'A',
      labelIdList: [destApple.id],
      startedAt: now + 1,
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      description: 'B',
      labelIdList: [destOrange.id],
      startedAt: now + 2,
      streamId: destStream.id,
      userId: user.id,
    },
    {
      id: expect.any(String),
      createdAt: now,
      updatedAt: now,
      description: 'C',
      labelIdList: [destApple.id, destOrange.id],
      startedAt: now + 3,
      streamId: destStream.id,
      userId: user.id,
    },
  ])
})

test('[complex] update point with same startedAt time in destination stream', async ({
  expect,
  now,
  db,
  user,
  srcStream,
  destStream,
  createPoint,
  createLabel,
}) => {
  const srcLabel = await createLabel({ streamId: srcStream.id, name: 'Cookie' })
  await createPoint({
    startedAt: now,
    description: 'src',
    streamId: srcStream.id,
    labelIdList: [srcLabel.id],
  })

  const destPoint = await createPoint({
    startedAt: now,
    description: 'dest',
    streamId: destStream.id,
  })

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStream.id],
    },
    now,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 1,
    upsertedPointCount: 1,
  })

  const destLabelList = await getLabelList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destLabelList)

  const destLabel = destLabelList.find((label) => label.name === 'Cookie')
  if (!destLabel) {
    throw expect.fail('Cookie label not found')
  }

  const destPointList = await getPointList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destPointList)

  expect(destPointList).toStrictEqual([
    {
      id: destPoint.id,
      createdAt: expect.any(Number),
      updatedAt: now,
      description: 'dest / src',
      labelIdList: [destLabel.id],
      startedAt: now,
      streamId: destStream.id,
      userId: user.id,
    },
  ])
})

test('[complex] handle two src streams with same startedAt time', async ({
  expect,
  now,
  db,
  user,
  destStream,
  createStream,
  createPoint,
  createLabel,
}) => {
  const srcStreamA = await createStream({ name: 'src-a' })
  const srcStreamB = await createStream({ name: 'src-b' })

  const labelA = await createLabel({ streamId: srcStreamA.id, name: 'A' })
  await createPoint({
    startedAt: now,
    description: 'a',
    streamId: srcStreamA.id,
    labelIdList: [labelA.id],
  })

  const labelB = await createLabel({ streamId: srcStreamB.id, name: 'B' })
  await createPoint({
    startedAt: now,
    description: 'b',
    streamId: srcStreamB.id,
    labelIdList: [labelB.id],
  })

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStreamA.id, srcStreamB.id],
    },
    now,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 2,
    upsertedPointCount: 1,
  })

  const destLabelList = await getLabelList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destLabelList)

  const destLabelA = destLabelList.find((label) => label.name === 'A')
  if (!destLabelA) {
    throw expect.fail('Label A not found')
  }
  const destLabelB = destLabelList.find((label) => label.name === 'B')
  if (!destLabelB) {
    throw expect.fail('Label B not found')
  }

  const destPointList = await getPointList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destPointList)

  expect(destPointList).toStrictEqual([
    {
      id: expect.any(String),
      createdAt: expect.any(Number),
      updatedAt: now,
      description: 'a / b',
      labelIdList: [destLabelA.id, destLabelB.id],
      startedAt: now,
      streamId: destStream.id,
      userId: user.id,
    },
  ])
})

test('[complex] handle two src streams with same startedAt time and dest stream', async ({
  expect,
  now,
  db,
  user,
  destStream,
  createStream,
  createPoint,
  createLabel,
}) => {
  const srcStreamA = await createStream({ name: 'src-a' })
  const srcStreamB = await createStream({ name: 'src-b' })

  const labelA = await createLabel({ streamId: srcStreamA.id, name: 'A' })
  await createPoint({
    startedAt: now,
    description: 'a',
    streamId: srcStreamA.id,
    labelIdList: [labelA.id],
  })

  const labelB = await createLabel({ streamId: srcStreamB.id, name: 'B' })
  await createPoint({
    startedAt: now,
    description: 'b',
    streamId: srcStreamB.id,
    labelIdList: [labelB.id],
  })

  const labelC = await createLabel({ streamId: destStream.id, name: 'C' })
  await createPoint({
    startedAt: now,
    description: 'dest',
    streamId: destStream.id,
    labelIdList: [labelC.id],
  })

  const result = await mergeStreamsIntoDestination({
    db,
    where: {
      userId: user.id,
      destinationStreamId: destStream.id,
      sourceStreamIdList: [srcStreamA.id, srcStreamB.id],
    },
    now,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    insertedLabelCount: 2,
    upsertedPointCount: 1,
  })

  const destLabelList = await getLabelList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destLabelList)

  const destLabelA = destLabelList.find((label) => label.name === 'A')
  if (!destLabelA) {
    throw expect.fail('Label A not found')
  }
  const destLabelB = destLabelList.find((label) => label.name === 'B')
  if (!destLabelB) {
    throw expect.fail('Label B not found')
  }

  const destPointList = await getPointList({
    db,
    where: {
      userId: user.id,
      streamId: destStream.id,
    },
  })
  assertOk(destPointList)

  expect(destPointList).toStrictEqual([
    {
      id: expect.any(String),
      createdAt: expect.any(Number),
      updatedAt: now,
      description: 'dest / a / b',
      labelIdList: [labelC.id, destLabelA.id, destLabelB.id],
      startedAt: now,
      streamId: destStream.id,
      userId: user.id,
    },
  ])
})
