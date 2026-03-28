<script lang="ts">
import { tz, tzOffset } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { SliceGrid } from '#lib/utils/slice-grid.js'

import { getSliceGrid } from '#lib/core/select/get-slice-grid.js'
import { getTimeZoneStream } from '#lib/core/select/get-time-zone-stream.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { watch } from '#lib/utils/watch.svelte.js'

import SliceList from './SliceList.svelte'

type Props = {
  store: Store
  viewStart: CalendarDate
  viewEnd: CalendarDate
}

const { store, viewStart, viewEnd }: Props = $props()

const { _: timeZoneStream } = $derived(watch(getTimeZoneStream(store)))

const { _: sliceGrid } = $derived(
  watch(
    getSliceGrid(store, {
      startedAt: {
        gte: calDateFns.toEarliestInstant(viewStart),
        lte: calDateFns.toLatestInstant(viewEnd),
      },
    }),
  ),
)

type ZonedSliceGrid = {
  date: CalendarDate
  startedAt: number
  timeZone: string
  sliceGrid: SliceGrid
}

/*
 * grouping slices by day
 * the sliceGrid is sorted by startedAt ascending
 * (i.e. oldest first)
 * this is important, as we need to track the current time zone as we progress
 * through the slices
 * however, for displaying the log, we want to show the most recent entries first
 * so after grouping, we reverse each list
 */
let multiDaySliceGrid = $derived.by(() => {
  let timeZone = 'UTC'
  let multiDaySliceGrid: ZonedSliceGrid[] = []
  let currentZSL: ZonedSliceGrid | undefined

  for (const row of sliceGrid.rowList) {
    const { startedAt, cellList } = row

    if (timeZoneStream) {
      for (const line of cellList) {
        if (typeof line === 'undefined') {
          continue
        }
        if (
          line.streamId === timeZoneStream.id &&
          line.startedAt === row.startedAt
        ) {
          timeZone = line.description
          // start a new sliceGrid
          currentZSL = undefined
        }
      }
    }

    // serialize as calendar date so we can compare days
    const date = calDateFns.fromInstant(startedAt, tz(timeZone))
    // ignore slices that are outside the time range
    if (date < viewStart || date > viewEnd) {
      continue
    }

    if (currentZSL?.date !== date) {
      currentZSL = {
        date,
        startedAt,
        timeZone,
        sliceGrid: { rowList: [] },
      }
      multiDaySliceGrid.push(currentZSL)
    }

    currentZSL.sliceGrid.rowList.push(row)
  }

  for (const zonedSliceList of multiDaySliceGrid) {
    zonedSliceList.sliceGrid.rowList.reverse()
  }

  return multiDaySliceGrid.reverse()
})
</script>

{#each multiDaySliceGrid as { startedAt, timeZone, sliceGrid }, index (index)}
  {@const prevTimeZone = multiDaySliceGrid[index + 1]?.timeZone}
  <div class="container">
    <h2>{dateFns.format(startedAt, 'PPPP', { in: tz(timeZone) })}</h2>
    <SliceList {store} {timeZone} {sliceGrid} />
  </div>
  {#if timeZone !== prevTimeZone}
    {@const offset = tzOffset(timeZone, new Date(startedAt))}
    {#if typeof prevTimeZone === 'undefined'}
      <div class="timeZoneChange">{timeZone} (UTC{#if offset > 0}+{/if}{offset / 60})</div>
    {:else}
      {@const prevOffset = tzOffset(prevTimeZone, new Date(startedAt))}
      {@const diff = (prevOffset - offset)/60}
      <div class="timeZoneChange">Time zone changed to {timeZone} ({#if diff > 0}+{/if}{diff} hours)</div>
    {/if}
  {/if}
{:else}
  <p>No entries found.</p>
{/each}

<style>
  .container {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .timeZoneChange {
    margin-top: var(--size-4);
    padding: var(--size-2);
    background-color: var(--color-yellow-300);
    border-radius: var(--radius-sm);
  }
</style>
