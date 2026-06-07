import { tz } from '@date-fns/tz'

import type { StreamId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { CalendarSpan } from '#lib/utils/calendar-span.js'
import type { Selection } from '#lib/utils/selector.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { mergeCalendarSpanList } from '#lib/utils/calendar-span.js'
import { createSelector } from '#lib/utils/selector.js'

import { getFilteredLineList } from './get-filtered-line-list.js'
import { getTimeZone } from './get-time-zone.js'

/**
 * Converts a stream's labelled line intervals into calendar-date spans.
 *
 * Use this for calendar views that need to show long-running labels across days;
 * each qualifying line contributes one span per label, and adjacent or
 * overlapping spans for the same label are merged.
 *
 * Quirk: spans may extend outside the requested date range so the calendar grid
 * can clip them at render time. Time-zone changes within a single line are not
 * split into separate spans.
 */
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
    now: number,
  ): Selection<CalendarSpan[]> => {
    const startedAtGte = calDateFns.toEarliestInstant(where.startDate)
    const startedAtLte = calDateFns.toLatestInstant(where.endDate)

    const $lineList = getFilteredLineList(
      store,
      streamId,
      {
        startedAt: {
          gte: startedAtGte,
          lte: startedAtLte,
        },
        durationMs: {
          gte: where.minDurationMs,
        },
      },
      now,
    )

    return () => {
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
              now,
              tz(getTimeZone(store, startedAtLte).value),
            )

        for (const labelId of line.labelIdList) {
          spanList.push([startedAtDate, stoppedAtDate, labelId])
        }
      }

      return mergeCalendarSpanList(spanList)
    }
  },
)

export { getCalendarSpanList }
