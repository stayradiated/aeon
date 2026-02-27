import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'
import { describe, expect, test } from 'vitest'

import type { CalendarDate } from './calendar-date.ts'

import {
  toEpochDate,
  addDays,
  format,
  fromInstant,
  fromISOString,
  subDays,
  toEarliestInstant,
  toInstant,
  toISOString,
  toLatestInstant,
  eachDayOfInterval,
  isWeekend,
} from './calendar-date.ts'

const AUCKLAND = 'Pacific/Auckland'
const CHICAGO = 'America/Chicago'

describe('toEpochDate', () => {
  test('should convert date to epoch date', () => {
    const friday = Date.UTC(2026, 1, 27)
    expect(toEpochDate(friday)).toBe(20511)

    const saturday = Date.UTC(2026, 1, 28)
    expect(toEpochDate(saturday)).toBe(20512)

    const sunday = Date.UTC(2026, 2, 1)
    expect(toEpochDate(sunday)).toBe(20513)
  })

  test('should start counting from epoch', () => {
    const instant = Date.UTC(1970, 0, 1)
    expect(toEpochDate(instant)).toBe(0)
  })
})

describe('format', () => {
  test('should format calendar date', () => {
    const date = [2026, 1, 28] as CalendarDate
    expect(format(date, 'PPPP')).toBe('Saturday, February 28th, 2026')
  })

  test('should format with time', () => {
    const date = [2026, 1, 28] as CalendarDate
    expect(format(date, 'PP pp')).toBe('Feb 28, 2026 12:00:00 PM')
  })
})

describe('fromInstant', () => {
  test('should parse date in zone', () => {
    const instant = 1772236818117 /* Sat Feb 28 2026 - 13:02:40 PM NZDT */

    const inAuckland = fromInstant(instant, AUCKLAND)
    expect(inAuckland).toStrictEqual([2026, 1, 28])

    const inChicago = fromInstant(instant, CHICAGO)
    expect(inChicago).toStrictEqual([2026, 1, 27])
  })
})

describe('toInstant', () => {
  test('should serialise date in zone', () => {
    const date = [2026, 1, 28] as CalendarDate

    const inAuckland = toInstant(date, AUCKLAND)
    expect(inAuckland).toBe(1772233200000)
    expect(dateFns.formatISO(inAuckland, { in: tz(AUCKLAND) })).toBe(
      '2026-02-28T12:00:00+13:00',
    )

    const inChicago = toInstant(date, CHICAGO)
    expect(inChicago).toBe(1772301600000)
    expect(dateFns.formatISO(inChicago, { in: tz(CHICAGO) })).toBe(
      '2026-02-28T12:00:00-06:00',
    )
  })
})

describe('toEarliestInstant', () => {
  test('should serialise date in earliest timezone', () => {
    const date = [2026, 1, 28] as CalendarDate

    const instant = toEarliestInstant(date)
    expect(instant).toBe(1772186400000)
    expect(dateFns.formatISO(instant, { in: tz('Etc/GMT-14') })).toBe(
      '2026-02-28T00:00:00+14:00',
    )
    expect(dateFns.formatISO(instant, { in: tz('UTC') })).toBe(
      '2026-02-27T10:00:00Z',
    )
    expect(dateFns.formatISO(instant, { in: tz('Etc/GMT+12') })).toBe(
      '2026-02-26T22:00:00-12:00',
    )
  })
})

describe('toLatestInstant', () => {
  test('should serialise date in latest timezone', () => {
    const date = [2026, 1, 28] as CalendarDate

    const instant = toLatestInstant(date)
    expect(instant).toBe(1772366399999)
    expect(dateFns.formatISO(instant, { in: tz('Etc/GMT+12') })).toBe(
      '2026-02-28T23:59:59-12:00',
    )
    expect(dateFns.formatISO(instant, { in: tz('UTC') })).toBe(
      '2026-03-01T11:59:59Z',
    )
    expect(dateFns.formatISO(instant, { in: tz('Etc/GMT-14') })).toBe(
      '2026-03-02T01:59:59+14:00',
    )
  })
})

describe('toISOString', () => {
  test('should format first day of year', () => {
    const date = [2026, 0, 1] as CalendarDate
    expect(toISOString(date)).toBe('2026-01-01')
  })
  test('should format last day of year', () => {
    const date = [2026, 11, 31] as CalendarDate
    expect(toISOString(date)).toBe('2026-12-31')
  })
})

describe('fromISOString', () => {
  test('should parse first day of year', () => {
    const date = '2026-01-01'
    expect(fromISOString(date)).toStrictEqual([2026, 0, 1])
  })
  test('should parse last day of year', () => {
    const date = '2026-12-31'
    expect(fromISOString(date)).toStrictEqual([2026, 11, 31])
  })
})

describe('eachDayOfInterval', () => {
  test('should return all days in interval', () => {
    const start = [2026, 0, 1] as CalendarDate
    const end = [2026, 11, 31] as CalendarDate

    const days = eachDayOfInterval({ start, end })
    expect(days).toHaveLength(365)
    expect(days[0]).toStrictEqual([2026, 0, 1])
    expect(days[364]).toStrictEqual([2026, 11, 31])
  })

  test('should handle crossing over to next year', () => {
    const start = [2026, 11, 31] as CalendarDate
    const end = [2027, 0, 1] as CalendarDate

    const days = eachDayOfInterval({ start, end })
    expect(days).toHaveLength(2)
    expect(days[0]).toStrictEqual([2026, 11, 31])
    expect(days[1]).toStrictEqual([2027, 0, 1])
  })

  test('should handle the same day', () => {
    const start = [2026, 0, 1] as CalendarDate
    const end = [2026, 0, 1] as CalendarDate

    const days = eachDayOfInterval({ start, end })
    expect(days).toHaveLength(1)
    expect(days[0]).toStrictEqual([2026, 0, 1])
  })
})

describe('addDays', () => {
  test('should add 1 day', () => {
    const date = [2026, 0, 1] as CalendarDate
    expect(addDays(date, 1)).toStrictEqual([2026, 0, 2])
  })
  test('should cross over to next month', () => {
    const date = [2026, 1, 28] as CalendarDate
    expect(addDays(date, 1)).toStrictEqual([2026, 2, 1])
  })
  test('should cross over into next year', () => {
    const date = [2026, 11, 31] as CalendarDate
    expect(addDays(date, 1)).toStrictEqual([2027, 0, 1])
  })
})

describe('subDays', () => {
  test('should subtract 1 day', () => {
    const date = [2026, 11, 31] as CalendarDate
    expect(subDays(date, 1)).toStrictEqual([2026, 11, 30])
  })

  test('should cross over to previous month', () => {
    const date = [2026, 11, 1] as CalendarDate
    expect(subDays(date, 1)).toStrictEqual([2026, 10, 30])
  })

  test('should cross over to previous year', () => {
    const date = [2026, 0, 1] as CalendarDate
    expect(subDays(date, 1)).toStrictEqual([2025, 11, 31])
  })
})

describe('isWeekend', () => {
  test('should return true for weekends', () => {
    const saturday = [2026, 1, 28] as CalendarDate
    expect(isWeekend(saturday)).toBe(true)

    const sunday = [2026, 2, 1] as CalendarDate
    expect(isWeekend(sunday)).toBe(true)
  })

  test('should return false for weekdays', () => {
    const monday = [2026, 2, 2] as CalendarDate
    expect(isWeekend(monday)).toBe(false)

    const tuesday = [2026, 2, 3] as CalendarDate
    expect(isWeekend(tuesday)).toBe(false)

    const wednesday = [2026, 2, 4] as CalendarDate
    expect(isWeekend(wednesday)).toBe(false)

    const thursday = [2026, 2, 5] as CalendarDate
    expect(isWeekend(thursday)).toBe(false)

    const friday = [2026, 2, 6] as CalendarDate
    expect(isWeekend(friday)).toBe(false)
  })
})
