import type { Signal } from 'signia'
import { computed } from 'signia'

import type { StreamId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { Grid } from '#lib/utils/calendar-grid.js'

import { buildGrid, pushCalendarSpan } from '#lib/utils/calendar-grid.js'
import { createSelector } from '#lib/utils/selector.js'

import { getCalendarSpanList } from './get-calendar-span-list.js'

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
  ): Signal<Grid> => {
    const $spanList = getCalendarSpanList(store, streamId, where, now)

    return computed('getCalendar', () => {
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
    })
  },
)

export { getCalendar }
