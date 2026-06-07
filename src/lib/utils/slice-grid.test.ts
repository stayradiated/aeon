import { expect, test } from 'vitest'

import type { Line } from '#lib/core/shape/types.js'
import type { PointId, StreamId } from '#lib/ids.js'

import { buildSliceGrid } from './slice-grid.js'

const line = (
  streamId: StreamId,
  id: string,
  startedAt: number,
  stoppedAt: number | undefined,
): Line => {
  return {
    id: id as PointId,
    streamId,
    labelIdList: [],
    description: '',
    startedAt,
    stoppedAt,
    durationMs: stoppedAt ? stoppedAt - startedAt : undefined,
  }
}

test('foo', () => {
  const people = 'people' as StreamId
  const location = 'location' as StreamId
  const project = 'project' as StreamId
  const task = 'task' as StreamId

  // People

  const joseph = line(people, 'joseph', 1349, 1421)

  // Location

  const bus = line(location, 'bus', 1308, 1349)
  const beach = line(location, 'beach', 1349, 1421)
  const town = line(location, 'town', 1421, 1425)
  const cafe = line(location, 'cafe', 1425, undefined)

  // Project

  const life = line(project, 'life', 1308, 1430)
  const aeon = line(project, 'aeon', 1430, undefined)

  // Task

  const onTheBus = line(task, 'on-the-bus', 1308, 1349)
  const walking = line(task, 'walking', 1349, 1425)
  const coffee = line(task, 'coffee', 1425, 1430)
  const design = line(task, 'design', 1430, undefined)

  const lineListRecord: Record<StreamId, Line[]> = {
    [people]: [joseph],
    [location]: [bus, beach, town, cafe],
    [project]: [life, aeon],
    [task]: [onTheBus, walking, coffee, design],
  }

  const streamIdList: StreamId[] = [people, location, project, task]

  const result = buildSliceGrid({
    lineListRecord,
    streamIdList,
    startedAt: 1308,
    stoppedAt: 1510,
  })
  expect(result).toStrictEqual({
    startedAt: 1308,
    stoppedAt: 1510,
    rowList: [
      {
        startedAt: 1308,
        stoppedAt: 1349,
        durationMs: 41,
        cellList: [undefined, bus, life, onTheBus],
      },
      {
        startedAt: 1349,
        stoppedAt: 1421,
        durationMs: 72,
        cellList: [joseph, beach, life, walking],
      },
      {
        startedAt: 1421,
        stoppedAt: 1425,
        durationMs: 4,
        cellList: [undefined, town, life, walking],
      },
      {
        startedAt: 1425,
        stoppedAt: 1430,
        durationMs: 5,
        cellList: [undefined, cafe, life, coffee],
      },
      {
        startedAt: 1430,
        stoppedAt: 1510,
        durationMs: 80,
        cellList: [undefined, cafe, aeon, design],
      },
    ],
  })
})

test('clips rows to the requested time range', () => {
  const streamId = 'stream' as StreamId

  const first = line(streamId, 'first', 100, 200)
  const second = line(streamId, 'second', 200, undefined)

  const result = buildSliceGrid({
    lineListRecord: {
      [streamId]: [first, second],
    },
    streamIdList: [streamId],
    startedAt: 150,
    stoppedAt: 250,
  })

  expect(result).toStrictEqual({
    startedAt: 150,
    stoppedAt: 250,
    rowList: [
      {
        startedAt: 150,
        stoppedAt: 200,
        durationMs: 50,
        cellList: [first],
      },
      {
        startedAt: 200,
        stoppedAt: 250,
        durationMs: 50,
        cellList: [second],
      },
    ],
  })
})

test('excludes rows that do not overlap the requested time range', () => {
  const streamId = 'stream' as StreamId

  const first = line(streamId, 'first', 100, 200)
  const second = line(streamId, 'second', 200, 300)
  const third = line(streamId, 'third', 300, 400)

  const result = buildSliceGrid({
    lineListRecord: {
      [streamId]: [first, second, third],
    },
    streamIdList: [streamId],
    startedAt: 225,
    stoppedAt: 275,
  })

  expect(result).toStrictEqual({
    startedAt: 225,
    stoppedAt: 275,
    rowList: [
      {
        startedAt: 225,
        stoppedAt: 275,
        durationMs: 50,
        cellList: [second],
      },
    ],
  })
})

test('returns an empty row list when no rows overlap the requested time range', () => {
  const streamId = 'stream' as StreamId

  const first = line(streamId, 'first', 100, 200)

  const result = buildSliceGrid({
    lineListRecord: {
      [streamId]: [first],
    },
    streamIdList: [streamId],
    startedAt: 300,
    stoppedAt: 400,
  })

  expect(result).toStrictEqual({
    startedAt: 300,
    stoppedAt: 400,
    rowList: [],
  })
})

test('excludes rows that only touch the requested time range boundary', () => {
  const streamId = 'stream' as StreamId

  const first = line(streamId, 'first', 100, 200)
  const second = line(streamId, 'second', 200, 300)

  const result = buildSliceGrid({
    lineListRecord: {
      [streamId]: [first, second],
    },
    streamIdList: [streamId],
    startedAt: 200,
    stoppedAt: 300,
  })

  expect(result).toStrictEqual({
    startedAt: 200,
    stoppedAt: 300,
    rowList: [
      {
        startedAt: 200,
        stoppedAt: 300,
        durationMs: 100,
        cellList: [second],
      },
    ],
  })
})
