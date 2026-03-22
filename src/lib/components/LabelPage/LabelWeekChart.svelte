<script lang="ts">
import { tz } from '@date-fns/tz'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'

import { getDailyDurationList } from '#lib/core/select/get-daily-duration-list.js'
import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { clockMin } from '#lib/utils/clock.js'
import { formatDuration } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  labelId: LabelId
}

const { store, labelId }: Props = $props()

const RANGE_WEEKS = 6
const WEEKDAY = 'SMTWTFS'

const { _: now } = $derived(watch(clockMin))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))

const today = $derived(calDateFns.fromInstant(now, tz(timeZone)))
const dateEnd = $derived(calDateFns.endOfWeek(today)) // sunday
const dateStart = $derived(
  calDateFns.addDays(calDateFns.subWeeks(dateEnd, RANGE_WEEKS), 1),
) // monday

const { _: label } = $derived(watch(store.label.get(labelId)))

const { _: dailyDurationList } = $derived(
  label
    ? watch(
        getDailyDurationList(
          store,
          label.streamId,
          {
            startedAt: {
              gte: calDateFns.toEarliestInstant(dateStart),
              lte: calDateFns.toLatestInstant(dateEnd),
            },
            labelId,
          },
          now,
        ),
      )
    : watch.lit([]),
)

const dailyDurationRecord = $derived.by(() => {
  const record: Record<CalendarDate, number> = {}
  for (const entry of dailyDurationList) {
    record[entry.date] = entry.durationMs
  }
  return record
})

const dateList = $derived(
  calDateFns.eachDayOfInterval({ start: dateStart, end: dateEnd }),
)

type Week = {
  entries: Array<{
    date: CalendarDate
    durationMs: number
  }>
  totalDurationMs: number
}

const weekList = $derived(
  Array.from({ length: RANGE_WEEKS }).map((_, i): Week => {
    const weekDateList = dateList.slice(i * 7, (i + 1) * 7)
    const entries = weekDateList.map((date) => ({
      date,
      durationMs: dailyDurationRecord[date] ?? 0,
    }))

    const totalDurationMs = entries.reduce(
      (sum, entry) => sum + entry.durationMs,
      0,
    )

    return {
      entries,
      totalDurationMs,
    }
  }),
)
</script>

<div class="LabelWeekChart" style:--cols={RANGE_WEEKS * 7} style:--color={label?.color ?? '#000'}>
  {#each weekList as week, index (index)}
    <div class="week">
      <div class="chart">
        {#each week.entries as entry (entry.date)}
          {@const isWeekend = calDateFns.isWeekend(entry.date)}
          <div class="day" class:isWeekend>
            <div class="bar" style:--height={Math.round((entry.durationMs / 1000 / 60) / 1440 * 100) + '%'}></div>
            <div class="label">{WEEKDAY[calDateFns.dayOfWeek(entry.date)]}</div>
          </div>
        {/each}
      </div>
      <div class="weekTotalDuration">{formatDuration(week.totalDurationMs)}</div>
    </div>
  {/each}
</div>

<style>
  .LabelWeekChart{
    --gap: var(--size-px);
    --col-width: calc((100cqw - ((var(--cols) - 1) * var(--gap))) / var(--cols));

    container-type: inline-size;
    display: flex;
    flex-direction: row;
    gap: var(--gap);
  }

  .week {
    width: calc((var(--col-width) * 7) + (var(--gap) * 6));

    &:nth-child(2n) {
      background: #eee;
    }

    .weekTotalDuration {
      padding-top: var(--size-4);
      padding-bottom: var(--size-2);
      font-size: var(--scale-000);
      text-align: center;
      color: var(--theme-text-muted);
      font-weight: var(--weight-bold);
    }
  }

  .chart {

    display: grid;
    grid-template-columns: repeat(var(--cols), var(--col-width));
    grid-template-rows: 200px 10px;
    grid-auto-flow: column;
    column-gap: var(--gap);
    row-gap: var(--size-1);
  }

  .day {
    display: contents;

    .bar {
      background: linear-gradient(
        to bottom,
        transparent calc(100% - var(--height)),
        var(--color) calc(100% - var(--height))
      );
    }

    .label {
      text-align: center;
      font-size: var(--scale-000);
      color: var(--theme-text-muted);
    }
    &.isWeekend .label {
      color: var(--color-grey-400);
    }
  }
</style>
