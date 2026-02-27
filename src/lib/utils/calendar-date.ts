import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

const MS_PER_DAY = 86_400_000;

type EpochDate = number & { __brand: 'EpochDate' }

// Convert a Date to an integer "epoch day" based on UTC calendar days.
const toEpochDate = (instant: number): EpochDate => {
  return Math.floor(instant / MS_PER_DAY) as EpochDate
}

type Year = number & { __brand: 'Year' }
type Month = number & { __brand: 'Month' }
type Day = number & { __brand: 'Day' }
type CalendarDate = [Year, Month, Day]

const getYear = (date: CalendarDate): number => date[0]
const getMonth = (date: CalendarDate): number => date[1] + 1
const getDay = (date: CalendarDate): number => date[2]

const toISOString = (date: CalendarDate): string => {
  const [year, month, day] = date
  return `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

const fromISOString = (iso: string): CalendarDate => {
  const match = iso.match(/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/)
  const year = Number.parseInt(match?.groups?.year ?? '', 10)
  const month = Number.parseInt(match?.groups?.month ?? '', 10)
  const day = Number.parseInt(match?.groups?.day ?? '', 10)

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    if (!match) {
      throw new Error(
        `Could not parse string as date, expecting "yyyy-MM-dd" format, received: "${iso}"`,
      )
    }
  }
  return [year, month - 1, day] as CalendarDate
}

const fromInstant = (instant: number, timeZone: string): CalendarDate => {
  const year = dateFns.getYear(instant, { in: tz(timeZone) }) as Year
  const month = dateFns.getMonth(instant, { in: tz(timeZone) }) as Month
  const day = dateFns.getDate(instant, { in: tz(timeZone) }) as Day
  return [year, month, day]
}

const toInstant = (date: CalendarDate, timeZone: string): number => {
  const isoString = toISOString(date)
  const instant = dateFns
    .parse(`${isoString} 12:00:00`, 'yyyy-MM-dd HH:mm:ss', new Date(), {
      in: tz(timeZone),
    })
    .getTime()
  return instant
}

const EARLIEST_TZ = 'Etc/GMT-14' // UTC+14 (earliest place to reach the date)
const LATEST_TZ = 'Etc/GMT+12' // UTC-12 (latest place to still be on the date)

const toEarliestInstant = (date: CalendarDate): number => {
  return dateFns
    .startOfDay(toInstant(date, EARLIEST_TZ), { in: tz(EARLIEST_TZ) })
    .getTime()
}

const toLatestInstant = (date: CalendarDate): number => {
  return dateFns
    .endOfDay(toInstant(date, LATEST_TZ), { in: tz(LATEST_TZ) })
    .getTime()
}

const format = (date: CalendarDate, formatStr: string): string => {
  return dateFns.format(toInstant(date, 'UTC'), formatStr, {
    in: tz('UTC'),
  })
}

const eachDayOfInterval  = ({ start, end }: { start: CalendarDate, end: CalendarDate }): CalendarDate[] => {
  const startInstant = toInstant(start, 'UTC')
  const endInstant = toInstant(end, 'UTC')

  return dateFns.eachDayOfInterval({
    start: startInstant,
    end: endInstant,
  }).map((date): CalendarDate => {
    return fromInstant(date.getTime(), 'UTC')
  })
}

const createTransform = <Args extends unknown[]>(
  fn: (instant: number, ...args: Args) => number,
) => {
  return (date: CalendarDate, ...args: Args) => {
    const instant = toInstant(date, 'UTC')
    const nextInstant = fn(instant, ...args)
    return fromInstant(nextInstant, 'UTC')
  }
}

const subDays = createTransform((instant, days: number) => {
  return dateFns.subDays(instant, days).getTime()
})

const addDays = createTransform((instant, days: number) => {
  return dateFns.addDays(instant, days).getTime()
})

const isWeekend = (date: CalendarDate): boolean => {
  const instant = toInstant(date, 'UTC')
  return dateFns.isWeekend(instant, { in: tz('UTC') })
}

export type { CalendarDate }
export {
  toEpochDate,
  getYear,
  getMonth,
  getDay,
  fromInstant,
  toInstant,
  toISOString,
  fromISOString,
  format,
  toEarliestInstant,
  toLatestInstant,
  eachDayOfInterval,
  subDays,
  addDays,
  isWeekend,
}
