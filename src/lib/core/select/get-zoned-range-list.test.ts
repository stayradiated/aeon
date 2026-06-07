import { tz } from '@date-fns/tz'
import { test as anyTest, describe } from 'vitest'

import type { Store } from '#lib/core/replicache/store.js'
import type { PointId, StreamId } from '#lib/ids.js'

import { useStore } from '#lib/test/use-store.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { genId } from '#lib/utils/gen-id.js'

import { getZonedRangeList } from './get-zoned-range-list.js'

const test = anyTest.extend({
  store: useStore(),
})

const startOfDay = (date: calDateFns.CalendarDate, timeZone: string) => {
  return calDateFns.startOfDay(date, tz(timeZone))
}

const endOfDay = (date: calDateFns.CalendarDate, timeZone: string) => {
  return calDateFns.endOfDay(date, tz(timeZone))
}

const createTimeZonePoint = async (
  store: Store,
  streamId: StreamId,
  timeZone: string,
  startedAt: number,
) => {
  await store.mutate.point_create({
    pointId: genId<PointId>(),
    streamId,
    labelIdList: [],
    description: timeZone,
    startedAt,
  })
}

describe('getZonedRangeList', () => {
  test('defaults to UTC when the Time Zone stream does not exist', async ({
    store,
    expect,
  }) => {
    const date = calDateFns.fromISOString('2024-01-01')

    const rangeList = getZonedRangeList(store, {
      start: date,
      end: date,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone: 'UTC',
        date,
        startedAt: startOfDay(date, 'UTC'),
        stoppedAt: endOfDay(date, 'UTC'),
      },
    ])
  })

  test('defaults to UTC when the Time Zone stream has no points', async ({
    store,
    expect,
  }) => {
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })

    const date = calDateFns.fromISOString('2024-01-01')

    const rangeList = getZonedRangeList(store, {
      start: date,
      end: date,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone: 'UTC',
        date,
        startedAt: startOfDay(date, 'UTC'),
        stoppedAt: endOfDay(date, 'UTC'),
      },
    ])
  })

  test('returns only the requested date for a single UTC day', async ({
    store,
    expect,
  }) => {
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })
    await createTimeZonePoint(store, streamId, 'UTC', Date.UTC(2023, 0, 1))

    const date = calDateFns.fromISOString('2024-01-01')

    const rangeList = getZonedRangeList(store, {
      start: date,
      end: date,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone: 'UTC',
        date,
        startedAt: startOfDay(date, 'UTC'),
        stoppedAt: endOfDay(date, 'UTC'),
      },
    ])
  })

  test('returns one range per requested date for a multi-day UTC range', async ({
    store,
    expect,
  }) => {
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })
    await createTimeZonePoint(store, streamId, 'UTC', Date.UTC(2023, 0, 1))

    const jan1 = calDateFns.fromISOString('2024-01-01')
    const jan2 = calDateFns.fromISOString('2024-01-02')
    const jan3 = calDateFns.fromISOString('2024-01-03')

    const rangeList = getZonedRangeList(store, {
      start: jan1,
      end: jan3,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone: 'UTC',
        date: jan1,
        startedAt: startOfDay(jan1, 'UTC'),
        stoppedAt: endOfDay(jan1, 'UTC'),
      },
      {
        timeZone: 'UTC',
        date: jan2,
        startedAt: startOfDay(jan2, 'UTC'),
        stoppedAt: endOfDay(jan2, 'UTC'),
      },
      {
        timeZone: 'UTC',
        date: jan3,
        startedAt: startOfDay(jan3, 'UTC'),
        stoppedAt: endOfDay(jan3, 'UTC'),
      },
    ])
  })

  test('uses the active time zone to calculate local day boundaries', async ({
    store,
    expect,
  }) => {
    const timeZone = 'Pacific/Auckland'
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })
    await createTimeZonePoint(store, streamId, timeZone, Date.UTC(2023, 0, 1))

    const date = calDateFns.fromISOString('2024-01-01')

    const rangeList = getZonedRangeList(store, {
      start: date,
      end: date,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone,
        date,
        startedAt: startOfDay(date, timeZone),
        stoppedAt: endOfDay(date, timeZone),
      },
    ])
  })

  test('uses DST-safe local day boundaries', async ({ store, expect }) => {
    const timeZone = 'America/New_York'
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })
    await createTimeZonePoint(store, streamId, timeZone, Date.UTC(2023, 0, 1))

    const date = calDateFns.fromISOString('2024-03-10')

    const rangeList = getZonedRangeList(store, {
      start: date,
      end: date,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone,
        date,
        startedAt: startOfDay(date, timeZone),
        stoppedAt: endOfDay(date, timeZone),
      },
    ])
    expect(rangeList.value[0]!.stoppedAt - rangeList.value[0]!.startedAt).toBe(
      23 * 60 * 60 * 1000 - 1,
    )
  })

  test('splits ranges when the time zone changes inside the requested dates', async ({
    store,
    expect,
  }) => {
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })

    const jan1 = calDateFns.fromISOString('2024-01-01')
    const jan2 = calDateFns.fromISOString('2024-01-02')
    const changeAt = Date.UTC(2024, 0, 2, 0, 0, 0, 0)

    await createTimeZonePoint(store, streamId, 'UTC', Date.UTC(2023, 0, 1))
    await createTimeZonePoint(store, streamId, 'Pacific/Auckland', changeAt)

    const rangeList = getZonedRangeList(store, {
      start: jan1,
      end: jan2,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone: 'UTC',
        date: jan1,
        startedAt: startOfDay(jan1, 'UTC'),
        stoppedAt: endOfDay(jan1, 'UTC'),
      },
      {
        timeZone: 'Pacific/Auckland',
        date: jan2,
        startedAt: changeAt,
        stoppedAt: endOfDay(jan2, 'Pacific/Auckland'),
      },
    ])
  })

  test('splits ranges when the time zone changes mid-local-day', async ({
    store,
    expect,
  }) => {
    const streamId = genId<StreamId>()
    await store.mutate.stream_create({ streamId, name: 'Time Zone' })

    const jan1 = calDateFns.fromISOString('2024-01-01')
    const changeAt = Date.UTC(2024, 0, 1, 12, 0, 0, 0)

    await createTimeZonePoint(store, streamId, 'UTC', Date.UTC(2023, 0, 1))
    await createTimeZonePoint(store, streamId, 'America/New_York', changeAt)

    const rangeList = getZonedRangeList(store, {
      start: jan1,
      end: jan1,
    })

    expect(rangeList.value).toEqual([
      {
        timeZone: 'UTC',
        date: jan1,
        startedAt: startOfDay(jan1, 'UTC'),
        stoppedAt: changeAt - 1,
      },
      {
        timeZone: 'America/New_York',
        date: jan1,
        startedAt: changeAt,
        stoppedAt: endOfDay(jan1, 'America/New_York'),
      },
    ])
  })
})
