import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest } from 'vitest'

import { getLabel } from '#lib/server/db/label/get-label.js'

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
    parentLabelIdList: [parentLabel.id],
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
  const label = await createLabel({
    streamId: stream.id,
    parentLabelIdList: [],
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
    updatedLabelCount: 1,
  })

  const updatedLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: label.id },
  })
  assertOk(updatedLabel)

  // the label should now have the parentId set to the parent label
  expect(updatedLabel).toMatchObject({
    parentLabelIdList: [parentLabel.id],
  })
})

test('should update the label to include the new parent', async ({
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
    parentLabelIdList: [oldParentLabel.id],
  })
  const newParentLabel = await createLabel({ streamId: parentStream.id })

  // note that the parent point uses the new parent label
  await createPoint({
    startedAt: now,
    streamId: parentStream.id,
    labelIdList: [newParentLabel.id],
  })

  // but the child point uses the old parent label
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
    updatedLabelCount: 1,
  })

  const updatedLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: label.id },
  })
  assertOk(updatedLabel)

  // the label should now have the new parent label
  expect(updatedLabel).toStrictEqual({
    ...label,
    parentLabelIdList: [oldParentLabel.id, newParentLabel.id],
    updatedAt: expect.any(Number),
  })
})

test('should not add a new label parent if one already exists', async ({
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
  const newParentLabel = await createLabel({ streamId: parentStream.id })

  // note that label points to both parent labels
  const label = await createLabel({
    streamId: stream.id,
    parentLabelIdList: [oldParentLabel.id, newParentLabel.id],
    name: 'Guitar George',
  })

  // note that the parent point uses the new parent label
  await createPoint({
    startedAt: now,
    streamId: parentStream.id,
    labelIdList: [newParentLabel.id],
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
    updatedLabelCount: 0,
  })

  const refreshedLabel = await getLabel({
    db,
    where: { userId: user.id, labelId: label.id },
  })
  assertOk(refreshedLabel)

  // the label should not have changed
  expect(refreshedLabel).toStrictEqual(label)
})
