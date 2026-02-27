<script lang="ts">
import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { PageProps } from './$types'

import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { clock } from '#lib/utils/clock.js'
import { watch } from '#lib/utils/watch.svelte.js'

import MultiDaySliceList from '#lib/components/Log/MultiDaySliceList.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const { _: now } = $derived(watch(clock))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))

let viewStart = $state<CalendarDate>()
let viewEnd = $state<CalendarDate>()

const handlePrev = () => {
  if (!viewStart || !viewEnd) {
    return
  }

  viewStart = calDateFns.subDays(viewStart, 7)
  viewEnd = calDateFns.subDays(viewEnd, 7)
}

const handleNext = () => {
  if (!viewStart || !viewEnd) {
    return
  }

  viewStart = calDateFns.addDays(viewStart, 7)
  viewEnd = calDateFns.addDays(viewEnd, 7)
}

const handleToday = () => {
  viewEnd = calDateFns.fromInstant(now, timeZone)
  viewStart = calDateFns.subDays(viewEnd, 6)
}

$effect.pre(() => {
  if (!viewStart && !viewEnd) {
    handleToday()
  }
})
</script>

{#if !viewStart || !viewEnd}
  <p>⚠️Could not initialise view range</p>
{:else}
  <div class="viewRange">
    <button onclick={handlePrev}>&larr;</button>
    {calDateFns.format(viewStart, 'dd MMM yyyy')} &mdash; {calDateFns.format(viewEnd, 'dd MMM yyyy')}
    <button onclick={handleNext}>&rarr;</button>
    <button onclick={handleToday}>Today</button>
  </div>

  <MultiDaySliceList {store} {viewStart} {viewEnd} />
{/if}

<style>
  .viewRange {
    text-align: center;
  }
</style>
