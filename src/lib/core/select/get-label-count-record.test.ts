import { test as anyTest } from 'vitest'

import type { LabelId, PointId, StreamId } from '#lib/ids.js'

import { useNow } from '#lib/test/use-now.js'
import { useStore } from '#lib/test/use-store.js'

import { genId } from '#lib/utils/gen-id.js'

import { getLabelCountRecord } from './get-label-count-record.js'

const test = anyTest.extend({
  now: useNow(),
  store: useStore(),
})

test('should count a label when the matching point is at index 0', async ({
  store,
  expect,
  now,
}) => {
  const streamId = genId<StreamId>()
  await store.mutate.stream_create({ streamId, name: 'Stream' })

  const labelId = genId<LabelId>()
  await store.mutate.label_create({
    labelId,
    streamId,
    name: 'Label',
    color: undefined,
    icon: undefined,
    parentLabelIdList: [],
  })

  const pointId = genId<PointId>()
  await store.mutate.point_create({
    pointId,
    streamId,
    labelIdList: [labelId],
    description: 'Point',
    startedAt: now,
  })

  const labelCountRecord = getLabelCountRecord(store, streamId, {
    startedAt: { gte: now, lte: now },
  })

  expect(labelCountRecord.value[labelId]).toBe(1)
})
