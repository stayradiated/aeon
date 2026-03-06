<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Cell } from '#lib/utils/calendar-grid.js'

import * as calDateFns from '#lib/utils/calendar-date.js'

import Track from './Track.svelte'

type Props = {
  store: Store
  cell: Cell
}

const { store, cell }: Props = $props()

const day = $derived(calDateFns.getDay(cell.date))
const dayName = $derived(calDateFns.format(cell.date, 'ccc'))
const isWeekend = $derived(calDateFns.isWeekend(cell.date))
const isFirstDayOfMonth = $derived(calDateFns.getDay(cell.date) === 1)
</script>

<div class="CalendarCell" class:isWeekend class:isFirstDayOfMonth>
  {#if isFirstDayOfMonth}
    <div class="monthName">{calDateFns.format(cell.date, 'LLLL')}</div>
  {/if}

  <div class="title">
    <div class="dayName">{dayName}</div>
    <div class="day">{day}</div>
  </div>

  <div class="tracks">
    {#each cell.tracks as track, index (index)}
      {#if !track}
        <div></div>
      {:else}
        <Track {store} {cell} {track} />
      {/if}
    {/each}
  </div>
</div>

<style>
  .CalendarCell {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
    min-height: var(--size-20);
    position: relative;

    &.isWeekend {
      background: var(--color-grey-200);
    }

    &.isFirstDayOfMonth {
      border-left: var(--size-1) solid var(--color-red-300);
    }
  }

  .monthName {
    position: absolute;
    background: var(--color-red-300);
    padding: var(--size-1) var(--size-2);
  }

  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--size-2);
    padding: var(--size-2);
  }

  .dayName {
    font-size: var(--scale-00);
    color: var(--color-grey-500);
    text-transform: uppercase;
  }

  .day {
    font-size: var(--scale-2);
    font-weight: var(--weight-bold);
    color: var(--color-grey-800);
  }

  .tracks {
    display: grid;
    grid-auto-flow: row;
    grid-auto-rows: 1fr;
    gap: var(--size-1);
  }
</style>
