import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest } from 'vitest'

import { getLabel } from '#lib/server/db/label/get-label.js'
import { getPoint } from '#lib/server/db/point/get-point.js'

import { useDb } from '#lib/test/use-db.js'
import { useCreateLabel } from '#lib/test/use-label.js'
import { useNow } from '#lib/test/use-now.js'
import { useCreatePoint } from '#lib/test/use-point.js'
import { useStream } from '#lib/test/use-stream.js'
import { useUser } from '#lib/test/use-user.js'

import { fixupLabelParents } from './fixup-label-parents.js'

const test = anyTest.extend({
  now: useNow(),
  db: useDb(),
  user: useUser(),
  stream: useStream(),
  parentStream: useStream(),
  createPoint: useCreatePoint(),
  createLabel: useCreateLabel(),
})

test('should handle empty stream', async ({
  expect,
  db,
  user,
  stream,
  parentStream,
}) => {
  const result = await fixupLabelParents({
    db,
    userId: user.id,
    streamId: stream.id,
    parentStreamId: parentStream.id,
  })
  assertOk(result)

  expect(result).toEqual({
    processedPointCount: 0,
    processedLabelCount: 0,
    duplicatedLabelCount: 0,
    updatedLabelCount: 0,
  })
})

test('should not change point with no parent', async ({
  expect,
  db,
  user,
  stream,
  parentStream,
  createPoint,
  createLabel,
}) => {
  const label = await createLabel()
  await createPoint({ streamId: stream.id, labelIdList: [label.id] })

  const result = await fixupLabelParents({
    db,
    userId: user.id,
    streamId: stream.id,
    parentStreamId: parentStream.id,
  })
  assertOk(result)

  expect(result).toEqual({
    processedPointCount: 1,
    processedLabelCount: 0,
    duplicatedLabelCount: 0,
    updatedLabelCount: 0,
  })
})

test('should not make any changes when the label is already assigned to the correct parent', async ({
  now,
  expect,
  db,
  user,
  stream,
  parentStream,
  createPoint,
  createLabel,
}) => {
  const parentLabel = await createLabel({ streamId: parentStream.id })
  const label = await createLabel({
    streamId: stream.id,
    parentId: parentLabel.id,
  })

  await createPoint({
    startedAt: now,
    streamId: parentStream.id,
    labelIdList: [parentLabel.id],
  })

  await createPoint({
    startedAt: now,
    streamId: stream.id,
    labelIdList: [label.id],
  })

  const result = await fixupLabelParents({
    db,
    userId: user.id,
    streamId: stream.id,
    parentStreamId: parentStream.id,
  })
  assertOk(result)

  expect(result).toEqual({
    processedPointCount: 1,
    processedLabelCount: 1,
    duplicatedLabelCount: 0,
    updatedLabelCount: 0,
  })
})

test('should update label parentId to match parent point', async ({
  expect,
  now,
  db,
  user,
  stream,
  parentStream,
  createPoint,
  createLabel,
}) => {
  const parentLabel = await createLabel({ streamId: parentStream.id })

  // note that `label` is not linked to the parent label
  const label = await createLabel({ streamId: stream.id, parentId: null })

  await createPoint({
    startedAt: now,
    streamId: parentStream.id,
    labelIdList: [parentLabel.id],
  })

  await createPoint({
    startedAt: now,
    streamId: stream.id,
    labelIdList: [label.id],
  })

  const result = await fixupLabelParents({
    db,
    userId: user.id,
    streamId: stream.id,
    parentStreamId: parentStream.id,
  })
  assertOk(result)

  expect(result).toEqual({
    processedPointCount: 1,
    processedLabelCount: 1,
    duplicatedLabelCount: 0,
    updatedLabelCount: 1,
  })

  const updatedLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: label.id },
  })
  assertOk(updatedLabel)

  // the label should now have the parentId set to the parent label
  expect(updatedLabel).toMatchObject({
    parentId: parentLabel.id,
  })
})

test('should duplicate the label and update the point to use the new label', async ({
  expect,
  now,
  db,
  user,
  stream,
  parentStream,
  createPoint,
  createLabel,
}) => {
  const oldParentLabel = await createLabel({ streamId: parentStream.id })
  const label = await createLabel({
    streamId: stream.id,
    parentId: oldParentLabel.id,
  })
  const newParentLabel = await createLabel({ streamId: parentStream.id })

  // note that the parent point uses the new parent label
  await createPoint({
    startedAt: now,
    streamId: parentStream.id,
    labelIdList: [newParentLabel.id],
  })

  // but the child point uses the old parent label
  const point = await createPoint({
    startedAt: now,
    streamId: stream.id,
    labelIdList: [label.id],
  })

  const result = await fixupLabelParents({
    db,
    userId: user.id,
    streamId: stream.id,
    parentStreamId: parentStream.id,
  })
  assertOk(result)

  expect(result).toEqual({
    processedPointCount: 1,
    processedLabelCount: 1,
    duplicatedLabelCount: 1,
    updatedLabelCount: 0,
  })

  const updatedLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: label.id },
  })
  assertOk(updatedLabel)
  // the label should not have changed
  expect(updatedLabel).toStrictEqual(label)

  // but there should be a new label with the new parent label
  const newLabel = await getLabel({
    db,
    where: {
      userId: user.id,
      parentId: newParentLabel.id,
      streamId: stream.id,
      name: label.name,
    },
  })
  assertOk(newLabel)

  expect(newLabel).toStrictEqual({
    ...label,

    parentId: newParentLabel.id,

    id: expect.any(String),
    createdAt: expect.any(Number),
    updatedAt: expect.any(Number),
  })

  // the point should have been updated to use the new label
  const updatedPoint = await getPoint({
    db,
    where: { userId: user.id, pointId: point.id },
  })
  assertOk(updatedPoint)

  expect(updatedPoint).toMatchObject({
    labelIdList: [newLabel?.id],
  })
})

test('should not create a new duplicate label if one already exists', async ({
  expect,
  now,
  db,
  user,
  stream,
  parentStream,
  createPoint,
  createLabel,
}) => {
  const oldParentLabel = await createLabel({ streamId: parentStream.id })
  const oldLabel = await createLabel({
    streamId: stream.id,
    parentId: oldParentLabel.id,
    name: 'Guitar George',
  })
  const newParentLabel = await createLabel({ streamId: parentStream.id })

  // this is the label that the point will be updated to use
  const newLabel = await createLabel({
    streamId: stream.id,
    parentId: newParentLabel.id,
    name: 'Guitar George', // must match the old label name
  })

  // note that the parent point uses the new parent label
  await createPoint({
    startedAt: now,
    streamId: parentStream.id,
    labelIdList: [newParentLabel.id],
  })

  // but the child point uses the old parent label
  const point = await createPoint({
    startedAt: now,
    streamId: stream.id,
    labelIdList: [oldLabel.id],
  })

  const result = await fixupLabelParents({
    db,
    userId: user.id,
    streamId: stream.id,
    parentStreamId: parentStream.id,
  })
  assertOk(result)

  expect(result).toEqual({
    processedPointCount: 1,
    processedLabelCount: 1,
    duplicatedLabelCount: 1,
    updatedLabelCount: 0,
  })

  const refreshedOldLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: oldLabel.id },
  })
  assertOk(refreshedOldLabel)
  // the label should not have changed
  expect(refreshedOldLabel).toStrictEqual(oldLabel)

  // the new label should also not have changed
  const refreshedNewLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: newLabel.id },
  })
  assertOk(refreshedNewLabel)
  // the label should not have changed
  expect(refreshedNewLabel).toStrictEqual(newLabel)

  // the point should have been updated to use the new label
  const updatedPoint = await getPoint({
    db,
    where: { userId: user.id, pointId: point.id },
  })
  assertOk(updatedPoint)
  expect(updatedPoint).toMatchObject({
    labelIdList: [newLabel.id],
  })
})
