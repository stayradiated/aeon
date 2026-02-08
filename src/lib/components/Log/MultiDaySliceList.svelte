<script lang="ts">
import { tz, tzOffset } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { Slice } from '#lib/core/shape/types.js'

import { getSliceList } from '#lib/core/select/get-slice-list.js'
import { getTimeZoneStream } from '#lib/core/select/get-time-zone-stream.js'

import { watch } from '#lib/utils/watch.svelte.js'

import SliceList from './SliceList.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const rangeStartDate = $derived(dateFns.subDays(Date.now(), 7).getTime())

const { _: timeZoneStream } = $derived(watch(getTimeZoneStream(store)))
const { _: sliceList } = $derived(
  watch(
    getSliceList(store, {
      startedAt: { gte: rangeStartDate },
    }),
  ),
)

type ZonedSliceList = {
  date: string
  startedAt: number
  timeZone: string
  sliceList: Slice[]
}

/*
 * grouping slices by day
 * the sliceList is sorted by startedAt ascending
 * (i.e. oldest first)
 * this is important, as we need to track the current time zone as we progress
 * through the slices
 * however, for displaying the log, we want to show the most recent entries first
 * so after grouping, we reverse each list
 */
let multiDaySliceList = $derived.by(() => {
  let timeZone = 'UTC'
  let multiDaySliceList: ZonedSliceList[] = []
  let currentZSL: ZonedSliceList | undefined

  for (const slice of sliceList) {
    const { startedAt, lineList } = slice

    if (timeZoneStream) {
      for (const line of lineList) {
        if (line.streamId === timeZoneStream.id) {
          timeZone = line.description
          // start a new sliceList
          currentZSL = undefined
        }
      }
    }

    // serialize as calendar date so we can compare days
    const date = dateFns.format(startedAt, 'yyyy-MM-dd', {
      in: tz(timeZone),
    })

    if (currentZSL?.date !== date) {
      currentZSL = {
        date,
        startedAt,
        timeZone,
        sliceList: [],
      }
      multiDaySliceList.push(currentZSL)
    }

    currentZSL.sliceList.push(slice)
  }

  for (const zonedSliceList of multiDaySliceList) {
    zonedSliceList.sliceList.reverse()
  }

  return multiDaySliceList.reverse()
})
</script>

{#each multiDaySliceList as { startedAt, timeZone, sliceList }, index (index)}
  {@const prevTimeZone = multiDaySliceList[index + 1]?.timeZone}
  <div class="container">
    <h2>{dateFns.format(startedAt, 'PPPP', { in: tz(timeZone) })}</h2>
    <SliceList {store} {timeZone} {sliceList} />
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
