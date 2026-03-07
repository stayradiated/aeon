<script lang="ts">
import { tz } from '@date-fns/tz'

import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { PageProps } from './$types'

import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { clockMinute } from '#lib/utils/clock.js'
import { watch } from '#lib/utils/watch.svelte.js'

import MultiDaySliceList from '#lib/components/Log/MultiDaySliceList.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const { _: now } = $derived(watch(clockMinute))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))

const SHOW_DAY_COUNT = 2
const NAV_DAY_COUNT = 1

let viewStart = $state<CalendarDate>()
let viewEnd = $state<CalendarDate>()

const today = $derived(calDateFns.fromInstant(now, tz(timeZone)))
const hasNext = $derived(viewEnd && viewEnd < today)
const isToday = $derived(viewEnd === today)

const handlePrev = () => {
  if (!viewStart || !viewEnd) {
    return
  }

  viewStart = calDateFns.subDays(viewStart, NAV_DAY_COUNT)
  viewEnd = calDateFns.subDays(viewEnd, NAV_DAY_COUNT)
}

const handleNext = () => {
  if (!viewStart || !viewEnd) {
    return
  }

  viewStart = calDateFns.addDays(viewStart, NAV_DAY_COUNT)
  viewEnd = calDateFns.addDays(viewEnd, NAV_DAY_COUNT)
}

const handleToday = () => {
  viewEnd = today
  viewStart = calDateFns.subDays(viewEnd, SHOW_DAY_COUNT - 1)
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
    <button disabled={isToday} onclick={handleToday}>{calDateFns.format(viewEnd, 'd MMM yyyy')}</button>
    <button disabled={!hasNext} onclick={handleNext}>&rarr;</button>
  </div>

  <MultiDaySliceList {store} {viewStart} {viewEnd} />
{/if}

<style>
  .viewRange {
    text-align: center;
  }
</style>
