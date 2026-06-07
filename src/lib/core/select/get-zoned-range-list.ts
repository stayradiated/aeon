import { tz } from '@date-fns/tz'

import type { Line } from '#lib/core/shape/types.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { Selection } from '#lib/utils/selector.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { createSelector } from '#lib/utils/selector.js'

import { getLineList } from './get-line-list.js'
import { getTimeZoneStream } from './get-time-zone-stream.js'

type ZonedRange = {
  timeZone: string
  date: CalendarDate
  startedAt: number
  stoppedAt: number
}

const getZonedRangeList = createSelector(
  'getZonedRangeList',
  (
    store,
    where: {
      start: CalendarDate
      end: CalendarDate
    },
  ): Selection<ZonedRange[]> => {
    const earliestInstant = calDateFns.toEarliestInstant(where.start)
    const latestInstant = calDateFns.toLatestInstant(where.end)

    const $timeZoneStream = getTimeZoneStream(store)

    return () => {
      const timeZoneStream = $timeZoneStream.value
      const lineList = timeZoneStream
        ? getLineList(store, timeZoneStream.id, {
            startedAt: { gte: earliestInstant, lte: latestInstant },
          }).value
        : []

      // Inject a UTC fallback before the first recorded time-zone line.
      const timeZoneLineList: Pick<
        Line,
        'description' | 'startedAt' | 'stoppedAt'
      >[] = [
        {
          description: 'UTC',
          startedAt: earliestInstant,
          stoppedAt: lineList[0]?.startedAt,
        },
        ...lineList,
      ]

      return timeZoneLineList.flatMap((line): ZonedRange[] => {
        const timeZone = line.description
        const inTimeZone = tz(timeZone)

        const startedAt = Math.max(line.startedAt, earliestInstant)
        const stoppedAt =
          typeof line.stoppedAt === 'number'
            ? Math.min(line.stoppedAt - 1, latestInstant)
            : latestInstant

        if (stoppedAt < startedAt) {
          return []
        }

        const startDate = calDateFns.max(
          where.start,
          calDateFns.fromInstant(startedAt, inTimeZone),
        )
        const endDate = calDateFns.min(
          where.end,
          calDateFns.fromInstant(stoppedAt, inTimeZone),
        )

        return calDateFns
          .eachDayOfInterval({ start: startDate, end: endDate })
          .map((date): ZonedRange => {
            return {
              timeZone,
              date,
              startedAt: Math.max(
                startedAt,
                calDateFns.startOfDay(date, inTimeZone),
              ),
              stoppedAt: Math.min(
                stoppedAt,
                calDateFns.endOfDay(date, inTimeZone),
              ),
            }
          })
      })
    }
  },
)

export type { ZonedRange }

export { getZonedRangeList }
