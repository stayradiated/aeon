<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { CalendarDate } from '#lib/utils/calendar-date.js'

import * as calDateFns from '#lib/utils/calendar-date.js'

import LabelPiece from './LabelPiece.svelte'

type Props = {
  store: Store
  calendarDate: CalendarDate
  labelIdList: LabelId[]
}

const { store, calendarDate, labelIdList }: Props = $props()

const day = $derived(calDateFns.getDay(calendarDate))
const dayName = $derived(calDateFns.format(calendarDate, 'ccc'))
const isWeekend = $derived(calDateFns.isWeekend(calendarDate))
</script>

<div class="dayCell" class:isWeekend>
  <div class="title">
    <div class="dayName">{dayName}</div>
    <div class="day">{day}</div>
  </div>

  <div class="labels">
    {#each labelIdList as labelId (labelId)}
      <LabelPiece {store} {labelId} />
    {/each}
  </div>
</div>

<style>
  .dayCell {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
    min-height: var(--size-20);

    &.isWeekend {
      background: var(--color-grey-200);
    }
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

  .labels {
    flex: 1;
    display: flex;
    flex-direction: row;
  }
</style>
