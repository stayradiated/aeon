import { tz } from '@date-fns/tz'
import { computed } from 'signia'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'

import { calcDuration } from '#lib/core/shape/calc-duration.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { createSelector } from '#lib/utils/selector.js'

import { getFilteredLineList } from './get-filtered-line-list.js'
import { getTimeZone } from './get-time-zone.js'

type DailyEntry = {
  date: CalendarDate
  durationMs: number
}

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
  ) => {
    const $lineList = getFilteredLineList(
      store,
      streamId,
      {
        startedAt: { gte: where.startedAt.gte, lte: where.startedAt.lte },
        labelId: where.labelId,
      },
      now,
    )

    return computed('getDailyDurationList', () => {
      const lineList = $lineList.value

      const entryRecord: Record<CalendarDate, DailyEntry> = {}

      for (const line of lineList) {
        const { startedAt } = line
        const timeZone = getTimeZone(store, startedAt).value
        const date = calDateFns.fromInstant(startedAt, tz(timeZone))

        entryRecord[date] ??= { date, durationMs: 0 }
        const entry = entryRecord[date]

        entry.durationMs += calcDuration(line, now)
      }

      return Object.values(entryRecord).sort((a, b) => {
        return a.date - b.date
      })
    })
  },
)

export { getDailyDurationList }
