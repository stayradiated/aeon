import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'
import { describe, expect, test } from 'vitest'

import {
  addDays,
  dayOfWeek,
  eachDayOfInterval,
  endOfWeek,
  format,
  formatISO,
  fromInstant,
  fromISOString,
  fromUTC,
  fromUTCInstant,
  getDay,
  getMonth,
  getYear,
  isWeekend,
  subDays,
  subWeeks,
  toEarliestInstant,
  toInstant,
  toLatestInstant,
} from './calendar-date.js'

const AUCKLAND = tz('Pacific/Auckland')
const CHICAGO = tz('America/Chicago')

describe('fromUTCInstant', () => {
  test('should convert date to epoch date', () => {
    const friday = Date.UTC(2026, 1, 27)
    expect(fromUTCInstant(friday)).toBe(20511)

    const saturday = Date.UTC(2026, 1, 28)
    expect(fromUTCInstant(saturday)).toBe(20512)

    const sunday = Date.UTC(2026, 2, 1)
    expect(fromUTCInstant(sunday)).toBe(20513)
  })

  test('should start counting from epoch', () => {
    const instant = Date.UTC(1970, 0, 1)
    expect(fromUTCInstant(instant)).toBe(0)
  })
})

describe('fromUTC', () => {
  test('should convert date to epoch date', () => {
    const date = fromUTC(2026, 1, 28)
    expect(date).toBe(20512)
  })

  test('should start counting from epoch', () => {
    const date = fromUTC(1970, 0, 1)
    expect(date).toBe(0)
  })
})

describe('format', () => {
  test('should format calendar date', () => {
    const date = fromUTC(2026, 1, 28)
    expect(format(date, 'PPPP')).toBe('Saturday, February 28th, 2026')
  })

  test('should format with time', () => {
    const date = fromUTC(2026, 1, 28)
    expect(format(date, 'PP pp')).toBe('Feb 28, 2026 12:00:00 AM')
  })
})

describe('fromInstant', () => {
  test('should parse date in zone', () => {
    const instant = 1772236818117 /* Sat Feb 28 2026 - 13:02:40 PM NZDT */

    const inAuckland = fromInstant(instant, AUCKLAND)
    expect(inAuckland).toBe(20512)
    expect(inAuckland).toBe(fromUTC(2026, 1, 28))

    const inChicago = fromInstant(instant, CHICAGO)
    expect(inChicago).toBe(20511)
    expect(inChicago).toBe(fromUTC(2026, 1, 27))
  })
})

describe('toInstant', () => {
  test('should serialise date in zone', () => {
    const date = fromUTC(2026, 1, 28)

    const inAuckland = toInstant(date, AUCKLAND)
    expect(dateFns.formatISO(inAuckland, { in: AUCKLAND })).toBe(
      '2026-02-28T00:00:00+13:00',
    )
    expect(inAuckland).toBe(1772190000000)

    const inChicago = toInstant(date, CHICAGO)
    expect(dateFns.formatISO(inChicago, { in: CHICAGO })).toBe(
      '2026-02-28T00:00:00-06:00',
    )
    expect(inChicago).toBe(1772258400000)
  })
})

describe('toEarliestInstant', () => {
  test('should serialise date in earliest timezone', () => {
    const date = fromUTC(2026, 1, 28)

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
    const date = fromUTC(2026, 1, 28)

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

describe('formatISO', () => {
  test('should format first day of year', () => {
    const date = fromUTC(2026, 0, 1)
    expect(formatISO(date)).toBe('2026-01-01')
  })
  test('should format last day of year', () => {
    const date = fromUTC(2026, 11, 31)
    expect(formatISO(date)).toBe('2026-12-31')
  })
})

describe('fromISOString', () => {
  test('should parse first day of year', () => {
    const date = '2026-01-01'
    expect(fromISOString(date)).toBe(20454)
    expect(fromISOString(date)).toBe(fromUTC(2026, 0, 1))
  })
  test('should parse last day of year', () => {
    const date = '2026-12-31'
    expect(fromISOString(date)).toBe(20818)
    expect(fromISOString(date)).toBe(fromUTC(2026, 11, 31))
  })
})

describe('eachDayOfInterval', () => {
  test('should return all days in interval', () => {
    const start = fromUTC(2026, 0, 1)
    const end = fromUTC(2026, 11, 31)

    const days = eachDayOfInterval({ start, end })
    expect(days).toHaveLength(365)
    expect(days[0]).toBe(fromUTC(2026, 0, 1))
    expect(days[364]).toBe(fromUTC(2026, 11, 31))
  })

  test('should handle crossing over to next year', () => {
    const start = fromUTC(2026, 11, 31)
    const end = fromUTC(2027, 0, 1)

    const days = eachDayOfInterval({ start, end })
    expect(days).toHaveLength(2)
    expect(days[0]).toBe(fromUTC(2026, 11, 31))
    expect(days[1]).toBe(fromUTC(2027, 0, 1))
  })

  test('should handle the same day', () => {
    const start = fromUTC(2026, 0, 1)
    const end = fromUTC(2026, 0, 1)

    const days = eachDayOfInterval({ start, end })
    expect(days).toHaveLength(1)
    expect(days[0]).toBe(fromUTC(2026, 0, 1))
  })
})

describe('addDays', () => {
  test('should add 1 day', () => {
    const date = fromUTC(2026, 0, 1)
    expect(addDays(date, 1)).toBe(fromUTC(2026, 0, 2))
  })
  test('should cross over to next month', () => {
    const date = fromUTC(2026, 1, 28)
    expect(addDays(date, 1)).toBe(fromUTC(2026, 2, 1))
  })
  test('should cross over into next year', () => {
    const date = fromUTC(2026, 11, 31)
    expect(addDays(date, 1)).toBe(fromUTC(2027, 0, 1))
  })
})

describe('subDays', () => {
  test('should subtract 1 day', () => {
    const date = fromUTC(2026, 11, 31)
    expect(subDays(date, 1)).toBe(fromUTC(2026, 11, 30))
  })

  test('should cross over to previous month', () => {
    const date = fromUTC(2026, 11, 1)
    expect(subDays(date, 1)).toBe(fromUTC(2026, 10, 30))
  })

  test('should cross over to previous year', () => {
    const date = fromUTC(2026, 0, 1)
    expect(subDays(date, 1)).toBe(fromUTC(2025, 11, 31))
  })
})

describe('subWeeks', () => {
  test('should subtract 1 week', () => {
    const date = fromUTC(2026, 11, 31)
    expect(subWeeks(date, 1)).toBe(fromUTC(2026, 11, 24))
  })
})

describe('dayOfWeek', () => {
  test('should work in 2026', () => {
    const sunday = fromUTC(2026, 2, 1)
    expect(dayOfWeek(sunday)).toBe(0)

    const monday = fromUTC(2026, 2, 2)
    expect(dayOfWeek(monday)).toBe(1)

    const tuesday = fromUTC(2026, 2, 3)
    expect(dayOfWeek(tuesday)).toBe(2)

    const wednesday = fromUTC(2026, 2, 4)
    expect(dayOfWeek(wednesday)).toBe(3)

    const thursday = fromUTC(2026, 2, 5)
    expect(dayOfWeek(thursday)).toBe(4)

    const friday = fromUTC(2026, 2, 6)
    expect(dayOfWeek(friday)).toBe(5)

    const saturday = fromUTC(2026, 2, 7)
    expect(dayOfWeek(saturday)).toBe(6)
  })

  test('should work in 2025', () => {
    const jan = fromUTC(2025, 0, 5)
    expect(dayOfWeek(jan)).toBe(0)

    const feb = fromUTC(2025, 1, 2)
    expect(dayOfWeek(feb)).toBe(0)

    const mar = fromUTC(2025, 2, 2)
    expect(dayOfWeek(mar)).toBe(0)
  })
})

describe('isWeekend', () => {
  test('should return true for weekends', () => {
    const saturday = fromUTC(2026, 1, 28)
    expect(isWeekend(saturday)).toBe(true)

    const sunday = fromUTC(2026, 2, 1)
    expect(isWeekend(sunday)).toBe(true)
  })

  test('should return false for weekdays', () => {
    const monday = fromUTC(2026, 2, 2)
    expect(isWeekend(monday)).toBe(false)

    const tuesday = fromUTC(2026, 2, 3)
    expect(isWeekend(tuesday)).toBe(false)

    const wednesday = fromUTC(2026, 2, 4)
    expect(isWeekend(wednesday)).toBe(false)

    const thursday = fromUTC(2026, 2, 5)
    expect(isWeekend(thursday)).toBe(false)

    const friday = fromUTC(2026, 2, 6)
    expect(isWeekend(friday)).toBe(false)
  })
})

describe('endOfWeek', () => {
  test('should work in 2026', () => {
    const monday = fromUTC(2026, 2, 2)
    const tuesday = fromUTC(2026, 2, 3)
    const wednesday = fromUTC(2026, 2, 4)
    const thursday = fromUTC(2026, 2, 5)
    const friday = fromUTC(2026, 2, 6)
    const saturday = fromUTC(2026, 2, 7)
    const sunday = fromUTC(2026, 2, 8)

    expect(endOfWeek(sunday)).toBe(sunday)
    expect(endOfWeek(monday)).toBe(sunday)
    expect(endOfWeek(tuesday)).toBe(sunday)
    expect(endOfWeek(wednesday)).toBe(sunday)
    expect(endOfWeek(thursday)).toBe(sunday)
    expect(endOfWeek(friday)).toBe(sunday)
    expect(endOfWeek(saturday)).toBe(sunday)
  })
})

describe('getYear', () => {
  test('should return year', () => {
    const date = fromUTC(2026, 0, 15)
    expect(getYear(date)).toBe(2026)
  })
})

describe('getMonth', () => {
  test('should return month', () => {
    const date = fromUTC(2026, 0, 15)
    expect(getMonth(date)).toBe(0)
  })
})

describe('getDay', () => {
  test('should return day', () => {
    const date = fromUTC(2026, 0, 15)
    expect(getDay(date)).toBe(15)
  })
})
