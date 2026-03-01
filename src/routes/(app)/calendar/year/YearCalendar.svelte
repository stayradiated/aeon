<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'

import { getCalendar } from '#lib/core/select/get-calendar.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { watch } from '#lib/utils/watch.svelte.js'

import DayCell from './DayCell.svelte'

type Props = {
  store: Store
  year: number
  streamId: StreamId
  onchangeyear?: (year: number) => void
}

const { store, year, streamId, onchangeyear }: Props = $props()

const startOfYear = $derived(calDateFns.fromISOString(`${year}-01-01`))
const endOfYear = $derived(calDateFns.fromISOString(`${year}-12-31`))

const calendarDateList = $derived(
  calDateFns.eachDayOfInterval({
    start: startOfYear,
    end: endOfYear,
  }),
)

// align the grid so that Mondays are on the left
const gridOffset = $derived(calDateFns.getDay(startOfYear) - 1)

const { _: calendar } = $derived(
  watch(
    getCalendar(store, streamId, {
      startDate: startOfYear,
      endDate: endOfYear,
      minDurationMs: 1000 * 60 * 60 * 12, // 12 hours
    }),
  ),
)

const handlePrev = () => {
  onchangeyear?.(year - 1)
}

const handleNext = () => {
  onchangeyear?.(year + 1)
}
</script>

<header>
  <button onclick={handlePrev}>&larr;</button>
  <h1>{year}</h1>
  <button onclick={handleNext}>&rarr;</button>
</header>

<div class="calendar">
  {#each Array(gridOffset) as _, index (index)}
    <div></div>
  {/each}
  {#each calendarDateList as calendarDate (calendarDate)}
    {@const labelIdList = calendar[calendarDate] ?? []}
    <DayCell {store} {calendarDate} {labelIdList} />
  {/each}
</div>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: var(--size-96);
    margin-inline: auto;
  }

  h1 {
    text-align: center;
  }

  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(auto, 1fr);
  }
</style>
