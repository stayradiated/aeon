<script lang="ts">
import { tzOffset } from '@date-fns/tz'

import type { Store } from '#lib/core/replicache/store.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'

import { getZonedRangeList } from '#lib/core/select/get-zoned-range-list.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { watch } from '#lib/utils/watch.svelte.js'

import SliceList from './SliceList.svelte'

type Props = {
  store: Store
  viewStart: CalendarDate
  viewEnd: CalendarDate
}

const { store, viewStart, viewEnd }: Props = $props()

const { _: zonedRangeList } = $derived(
  watch(
    getZonedRangeList(store, {
      start: viewStart,
      end: viewEnd,
    }),
  ),
)

const reversedZoneRangeList = $derived(zonedRangeList.toReversed())
</script>

{#each reversedZoneRangeList as zonedRange, index (index)}
  {@const timeZone = zonedRange.timeZone}
  {@const prevTimeZone = reversedZoneRangeList[index + 1]?.timeZone}
  <div class="container">
    <h2>{calDateFns.format(zonedRange.date, 'PP')}</h2>
    <SliceList {store} {timeZone} startedAt={zonedRange.startedAt} stoppedAt={zonedRange.stoppedAt} />
  </div>
  {#if timeZone !== prevTimeZone}
    {@const offset = tzOffset(timeZone, new Date(zonedRange.startedAt))}
    {#if typeof prevTimeZone === 'undefined'}
      <div class="timeZoneChange">{timeZone} (UTC{#if offset > 0}+{/if}{offset / 60})</div>
    {:else}
      {@const prevOffset = tzOffset(prevTimeZone, new Date(zonedRange.startedAt))}
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

  h2 {
    text-align: center;
    margin-block: 0;
    line-height: var(--line-xl);
    background: var(--color-grey-100);
  }

  .timeZoneChange {
    margin-top: var(--size-4);
    padding: var(--size-2);
    background-color: var(--color-yellow-300);
    border-radius: var(--radius-sm);
  }
</style>
