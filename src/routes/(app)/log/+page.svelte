<script lang="ts">
import { tz } from '@date-fns/tz'

import type { PageProps } from './$types'

import { goto } from '$app/navigation'
import { page } from '$app/state'

import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { clockMin } from '#lib/utils/clock.js'
import { watch } from '#lib/utils/watch.svelte.js'

import MultiDaySliceList from '#lib/components/Log/MultiDaySliceList.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const { _: now } = $derived(watch(clockMin))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))

const SHOW_DAY_COUNT = 2
const NAV_DAY_COUNT = 1

const dateParam = $derived(page.url.searchParams.get('date'))

let viewEnd = $derived(
  typeof dateParam === 'string'
    ? calDateFns.fromISOString(dateParam)
    : undefined,
)
let viewStart = $derived(
  viewEnd ? calDateFns.subDays(viewEnd, SHOW_DAY_COUNT - 1) : undefined,
)

const today = $derived(calDateFns.fromInstant(now, tz(timeZone)))
const hasNext = $derived(viewEnd && viewEnd < today)
const isToday = $derived(viewEnd === today)

const handlePrev = () => {
  if (!viewStart || !viewEnd) {
    return
  }

  const nextDate = calDateFns.subDays(viewEnd, NAV_DAY_COUNT)
  const nextUrl = new URL(page.url)
  nextUrl.searchParams.set('date', calDateFns.formatISO(nextDate))
  goto(nextUrl)
}

const handleNext = () => {
  if (!viewStart || !viewEnd) {
    return
  }

  const nextDate = calDateFns.addDays(viewEnd, NAV_DAY_COUNT)
  const nextUrl = new URL(page.url)
  nextUrl.searchParams.set('date', calDateFns.formatISO(nextDate))
  goto(nextUrl)
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
