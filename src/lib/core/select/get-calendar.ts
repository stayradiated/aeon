import type { Signal } from 'signia'
import { computed } from 'signia'

import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { StreamId, LabelId } from '#lib/ids.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { createSelector } from '#lib/utils/selector.js'

import { getFilteredLineList } from './get-filtered-line-list.js'
import { getTimeZone } from './get-time-zone.js'

type Calendar = Record<string, LabelId[]>

const getCalendar = createSelector(
  'getCalendar',
  (
    store,
    streamId: StreamId,
    where: {
      startDate: CalendarDate
      endDate: CalendarDate
      minDurationMs: number
    },
  ): Signal<Calendar> => {
    const startedAtGte = calDateFns.toEarliestInstant(where.startDate)
    const startedAtLte = calDateFns.toLatestInstant(where.endDate)

    const $lineList = getFilteredLineList(store, streamId, {
      startedAt: {
        gte: startedAtGte,
        lte: startedAtLte,
      },
      durationMs: {
        gte: where.minDurationMs,
      },
    })

    return computed('getCalendar', () => {
      const lineList = $lineList.value

      // map ISO Date to a list of label IDs
      const calendar: Calendar = {}

      for (const line of lineList) {
        const { startedAt, stoppedAt } = line
        const startedAtDate = calDateFns.fromInstant(
          startedAt,
          getTimeZone(store, startedAt).value,
        )
        const stoppedAtDate = stoppedAt
          ? calDateFns.fromInstant(
              stoppedAt,
              getTimeZone(store, stoppedAt).value,
            )
          : calDateFns.fromInstant(
              startedAtLte,
              getTimeZone(store, startedAtLte).value,
            )

        for (const date of calDateFns.eachDayOfInterval({ start: startedAtDate, end: stoppedAtDate })) {
          const key = calDateFns.toISOString(date)
          calendar[key] ??= []
          for (const labelId of line.labelIdList) {
            if (calendar[key].includes(labelId)) {
              continue
            }
            calendar[key].push(labelId)
          }
        }
      }

      return calendar
    })
  },
)

export { getCalendar }
