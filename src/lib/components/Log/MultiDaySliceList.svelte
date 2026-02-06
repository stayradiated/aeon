<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'

import { getSliceList } from '#lib/core/select/get-slice-list.js'
import { getUserTimeZone } from '#lib/core/select/get-user-time-zone.js'

import { groupBy } from '#lib/utils/group-by.js'
import { watch } from '#lib/utils/watch.svelte.js'

import SliceList from './SliceList.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: timeZone } = $derived(watch(getUserTimeZone(store)))
const rangeStartDate = $derived(
  dateFns
    .startOfDay(dateFns.subDays(Date.now(), 7), { in: tz(timeZone) })
    .getTime(),
)

const { _: sliceList } = $derived(
  watch(
    getSliceList(store, {
      startedAt: { gte: rangeStartDate },
    }),
  ),
)

/* grouping slices by day */
let sliceListByDay = $derived(
  groupBy(sliceList.toReversed(), (slice) => {
    const { startedAt } = slice

    // Format as Friday 02 June 2023
    const day = dateFns.format(startedAt, 'EEEE dd MMMM yyyy', {
      in: tz(timeZone),
    })
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
