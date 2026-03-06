import { tz } from '@date-fns/tz'
import type { Signal } from 'signia'
import { computed } from 'signia'

import type { StreamId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { CalendarSpan } from '#lib/utils/calendar-span.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { mergeCalendarSpanList } from '#lib/utils/calendar-span.js'
import { createSelector } from '#lib/utils/selector.js'

import { getFilteredLineList } from './get-filtered-line-list.js'
import { getTimeZone } from './get-time-zone.js'

const getCalendarSpanList = createSelector(
  'getCalendarSpanList',
  (
    store,
    streamId: StreamId,
    where: {
      startDate: CalendarDate
      endDate: CalendarDate
      minDurationMs: number
    },
  ): Signal<CalendarSpan[]> => {
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

    return computed('getCalendarSpanList', () => {
      const lineList = $lineList.value

      const spanList: CalendarSpan[] = []

      for (const line of lineList) {
        const { startedAt, stoppedAt } = line
        const startedAtDate = calDateFns.fromInstant(
          startedAt,
          tz(getTimeZone(store, startedAt).value),
        )
        const stoppedAtDate = stoppedAt
          ? calDateFns.fromInstant(
              stoppedAt,
              tz(getTimeZone(store, stoppedAt).value),
            )
          : calDateFns.fromInstant(
              startedAtLte,
              tz(getTimeZone(store, startedAtLte).value),
            )

        for (const labelId of line.labelIdList) {
          spanList.push([startedAtDate, stoppedAtDate, labelId])
        }
      }

      return mergeCalendarSpanList(spanList)
    })
  },
)

export { getCalendarSpanList }
