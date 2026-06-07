import { tz } from '@date-fns/tz'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { Selection } from '#lib/utils/selector.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { createSelector } from '#lib/utils/selector.js'

import { getFilteredLineList } from './get-filtered-line-list.js'
import { getTimeZone } from './get-time-zone.js'

type DailyDuration = {
  date: CalendarDate
  durationMs: number
}

/**
 * Totals the duration of a label for each calendar date in a stream.
 *
 * Use this for label activity charts and heat maps. Open-ended lines are counted
 * up to `now`, and durations that cross midnight are split by local day using
 * the active time zone at the line's start.
 *
 * Quirk: time-zone changes during a line are not handled, and boundary context
 * can produce entries just outside the requested instant range.
 */
const getDailyDurationList = createSelector(
  'getDailyDurationList',
  (
    store,
    streamId: StreamId,
    where: {
      startedAt: {
        gte: number
        lte: number
      }
      labelId: LabelId
    },
    now: number,
  ): Selection<DailyDuration[]> => {
    const $lineList = getFilteredLineList(
      store,
      streamId,
      {
        startedAt: { gte: where.startedAt.gte, lte: where.startedAt.lte },
        labelId: where.labelId,
      },
      now,
    )

    return () => {
      const lineList = $lineList.value

      const entryRecord: Record<CalendarDate, DailyDuration> = {}

      for (const line of lineList) {
        const { startedAt, stoppedAt } = line

        // TODO: handle timezone changes during this time
        const timeZoneName = getTimeZone(store, startedAt).value
        const timeZone = tz(timeZoneName)

        for (const date of calDateFns.eachDayOfInterval({
          start: calDateFns.fromInstant(startedAt, timeZone),
          end: calDateFns.fromInstant(stoppedAt ?? now, timeZone),
        })) {
          const startOfDay = calDateFns.toInstant(date, timeZone)
          const endOfDay = startOfDay + calDateFns.MS_PER_DAY
          const startInstant = Math.max(startedAt, startOfDay)
          const stopInstant = Math.min(stoppedAt ?? now, endOfDay)
          const durationMs = stopInstant - startInstant

          if (entryRecord[date]) {
            entryRecord[date].durationMs += durationMs
          } else {
            entryRecord[date] = { date, durationMs }
          }
        }
      }

      return Object.values(entryRecord).sort((a, b) => {
        return a.date - b.date
      })
    }
  },
)

export { getDailyDurationList }
