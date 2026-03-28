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

  const result = buildSliceGrid({ lineListRecord, streamIdList })
  expect(result).toStrictEqual({
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
        stoppedAt: undefined,
        durationMs: undefined,
        cellList: [undefined, cafe, aeon, design],
      },
    ],
  })
})
