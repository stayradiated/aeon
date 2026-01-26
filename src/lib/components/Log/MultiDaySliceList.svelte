<script lang="ts">
import * as dateFns from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

import type { Store } from '#lib/core/replicache/store.js'

import { getSliceList } from '#lib/core/select/get-slice-list.js'
import { getUserTimeZone } from '#lib/core/select/get-user-time-zone.js'

import { groupBy } from '#lib/utils/group-by.js'
import { query } from '#lib/utils/query.js'
import { startOfDayWithTimeZone } from '#lib/utils/zoned-date.js'

import SliceList from './SliceList.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { timeZone, sliceList } = $derived(
  query(() => {
    const timeZone = getUserTimeZone(store).value

    const rangeStartDate = startOfDayWithTimeZone({
      instant: dateFns.subDays(Date.now(), 7).getTime(),
      timeZone,
    }).getTime()

    return {
      timeZone,
      sliceList: getSliceList(store, {
        startedAt: { gte: rangeStartDate },
      }).value.toReversed(),
    }
  }),
)

/* grouping slices by day */
let sliceListByDay = $derived(
  groupBy(sliceList, (slice) => {
    const { startedAt: startedAtUTC } = slice
    const startedAt = toZonedTime(startedAtUTC, timeZone)

    // Format as Friday 02 June 2023
    const day = dateFns.format(startedAt, 'EEEE dd MMMM yyyy')
    return day
  }),
)
</script>

{#if Object.keys(sliceListByDay).length === 0}
  <p>No entries found.</p>
{:else}
  {#each Object.entries(sliceListByDay) as [day, sliceList] (day)}
    <div class="container">
      <h2>{day}</h2>
      <SliceList {store} {sliceList} />
    </div>
  {/each}
{/if}

<style>
	.container {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}
</style>
