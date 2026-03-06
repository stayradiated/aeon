import type { LabelId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'

type CalendarSpan = [CalendarDate, CalendarDate, LabelId]

const mergeCalendarSpanList = (list: CalendarSpan[]): CalendarSpan[] => {
  const byLabel: Record<LabelId, CalendarSpan[]> = {}

  outer: for (const item of list) {
    const [startDate, endDate, labelId] = item

    byLabel[labelId] ??= []
    const labelSpanList = byLabel[labelId]

    for (const span of labelSpanList) {
      // [span]
      //       [newSpan]
      if (span[1] === startDate - 1) {
        span[1] = endDate
        continue outer
      }

      //          [span]
      // [newSpan]
      if (span[0] === endDate + 1) {
        span[0] = startDate
        continue outer
      }

      // [span---------]
      //    [newSpan]
      if (span[0] <= startDate && span[1] >= endDate) {
        continue outer
      }

      // [span]
      //    [newSpan]
      if (span[0] <= startDate && span[1] >= startDate) {
        span[1] = endDate
        continue outer
      }

      //       [span]
      // [newSpan]
      if (span[0] <= endDate && span[1] >= endDate) {
        span[0] = startDate
        continue outer
      }
    }

    labelSpanList.push([startDate, endDate, labelId])
  }

  const out: CalendarSpan[] = Object.values(byLabel).flat()
  return out
}

export { mergeCalendarSpanList }
export type { CalendarSpan }
