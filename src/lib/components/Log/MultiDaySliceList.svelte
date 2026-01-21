<script lang="ts">
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

import type { Slice } from '#lib/core/select/types.js'
import type { Label, Stream } from '#lib/types.local.js'

import { groupBy } from '#lib/utils/group-by.js'

import SliceList from './SliceList.svelte'

interface Props {
  streamList: Stream[]
  sliceList: Slice[]
  timeZone: string
  labelRecord: Record<string, Label>
}

let { streamList, sliceList, timeZone, labelRecord }: Props = $props()

/* grouping slices by day */
let sliceListByDay = $derived(
  groupBy(sliceList, (slice) => {
    const { startedAt: startedAtUTC } = slice
    const startedAt = toZonedTime(startedAtUTC, timeZone)

    // Format as Friday 02 June 2023
    const day = format(startedAt, 'EEEE dd MMMM yyyy')
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
      <SliceList {streamList} {sliceList} {timeZone} {labelRecord} />
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
