import { tz } from '@date-fns/tz'
import { UTCDate, utc } from '@date-fns/utc'
import type { ContextFn } from 'date-fns'
import * as dateFns from 'date-fns'

type TimeZone = ContextFn<Date>

const MS_PER_DAY = 86_400_000

type CalendarDate = number & { __brand: 'CalendarDate' }

const fromUTCInstant = (instant: number): CalendarDate => {
  return Math.floor(instant / MS_PER_DAY) as CalendarDate
}

const fromUTC = (
  year: number,
  monthIndex: number,
  day: number,
): CalendarDate => {
  return fromUTCInstant(Date.UTC(year, monthIndex, day))
}

const toUTCInstant = (date: CalendarDate): number => {
  return date * MS_PER_DAY
}

const getYear = (date: CalendarDate): number => {
  return new Date(toUTCInstant(date)).getUTCFullYear()
}
const getMonth = (date: CalendarDate): number => {
  return new Date(toUTCInstant(date)).getUTCMonth()
}
const getDay = (date: CalendarDate): number => {
  return new Date(toUTCInstant(date)).getUTCDate()
}

const formatISO = (date: CalendarDate): string => {
  return dateFns.formatISO(toUTCInstant(date), { representation: 'date' })
}

const fromISOString = (iso: string): CalendarDate => {
  return fromUTCInstant(dateFns.parseISO(iso, { in: utc }).getTime())
}

const fromInstant = (instant: number, timeZone: TimeZone): CalendarDate => {
  return fromUTCInstant(dateFns.transpose(timeZone(instant), UTCDate).getTime())
}

const toInstant = (date: CalendarDate, timeZone: TimeZone): number => {
  return dateFns.transpose(new UTCDate(toUTCInstant(date)), timeZone).getTime()
}

const EARLIEST_TZ = tz('Etc/GMT-14')
const LATEST_TZ = tz('Etc/GMT+12')

const toEarliestInstant = (date: CalendarDate): number => {
  return toInstant(date, EARLIEST_TZ)
}

const toLatestInstant = (date: CalendarDate): number => {
  return toInstant(date, LATEST_TZ) + MS_PER_DAY - 1
}

const format = (date: CalendarDate, formatStr: string): string => {
  return dateFns.format(toUTCInstant(date), formatStr, { in: utc })
}

const eachDayOfInterval = ({
  start,
  end,
}: {
  start: CalendarDate
  end: CalendarDate
}): CalendarDate[] => {
  if (end < start) {
    return []
  }
  const n = end - start + 1
  const out = new Array<CalendarDate>(n)
  for (let i = 0; i < n; i++) {
    out[i] = (start + i) as CalendarDate
  }
  return out
}

const subDays = (date: CalendarDate, days: number): CalendarDate => {
  return (date - days) as CalendarDate
}

const addDays = (date: CalendarDate, days: number): CalendarDate => {
  return (date + days) as CalendarDate
}

const dayOfWeek = (date: CalendarDate): number => {
  return (date + 4) % 7
}

const isWeekend = (date: CalendarDate): boolean => {
  const day = dayOfWeek(date)
  return day === 0 || day === 6
}

export type { CalendarDate }

export {
  addDays,
  dayOfWeek,
  eachDayOfInterval,
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
  toEarliestInstant,
  toInstant,
  toLatestInstant,
}
