<script lang="ts">
import * as calDateFns from '#lib/utils/calendar-date.js'

import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'

import { getCalendar } from '#lib/core/select/get-calendar.js'

import { watch } from '#lib/utils/watch.svelte.js'

import DayCell from './DayCell.svelte'

type Props = {
  store: Store
  year: number
  streamId: StreamId
}

const { store, year, streamId }: Props = $props()

const startOfYear = $derived(calDateFns.fromISOString(`${year}-01-01`))
const endOfYear = $derived(calDateFns.fromISOString(`${year}-12-31`))

const calendarDateList = $derived(calDateFns.eachDayOfInterval({
  start: startOfYear,
  end: endOfYear,
}))

// align the grid so that Mondays are on the left
const gridOffset = $derived(startOfYear[2] - 1)

const { _: calendar } = $derived(
  watch(
    getCalendar(store, streamId, {
      startDate: startOfYear,
      endDate: endOfYear,
      minDurationMs: 1000 * 60 * 60 * 12, // 12 hours
    })
  )
)
$inspect(calendar)
</script>

<h1>{year}</h1>

<div class="calendar">
  {#each Array(gridOffset) as _, index (index)}
    <div></div>
  {/each}
  {#each calendarDateList as calendarDate (calDateFns.toISOString(calendarDate))}
    {@const labelIdList = calendar[calDateFns.toISOString(calendarDate)] ?? []}
    <DayCell {store} {calendarDate} {labelIdList} />
  {/each}
</div>

<style>
  h1 {
    text-align: center;
  }

  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(auto, 1fr);
  }
</style>
