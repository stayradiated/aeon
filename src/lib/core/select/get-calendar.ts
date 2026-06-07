import type { StreamId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { Grid } from '#lib/utils/calendar-grid.js'
import type { Selection } from '#lib/utils/selector.js'

import { buildGrid, pushCalendarSpan } from '#lib/utils/calendar-grid.js'
import { createSelector } from '#lib/utils/selector.js'

import { getCalendarSpanList } from './get-calendar-span-list.js'

/**
 * Builds a calendar grid populated with the labelled spans for one stream.
 *
 * Use this for year or month-style overviews where each cell is a calendar date
 * and long-running labels should be laid out on non-overlapping tracks.
 */
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
    now: number,
  ): Selection<Grid> => {
    const $spanList = getCalendarSpanList(store, streamId, where, now)

    return () => {
      const spanList = $spanList.value

      const grid = buildGrid({
        startDate: where.startDate,
        endDate: where.endDate,
        width: 7,
      })

      for (const span of spanList) {
        pushCalendarSpan(grid, span)
      }

      return grid
    }
  },
)

export { getCalendar }
