<script lang="ts">
import type { StreamId } from '#lib/ids.js'
import type { PageProps } from './$types'

import { getVisibleStreamList } from '#lib/core/select/get-visible-stream-list.js'

import { watch } from '#lib/utils/watch.svelte.js'

import StreamSelector from './StreamSelector.svelte'
import YearCalendar from './YearCalendar.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const { _: streamList } = $derived(watch(getVisibleStreamList(store)))

let selectedStreamId = $state<StreamId | undefined>()

$effect(() => {
  if (!selectedStreamId) {
    selectedStreamId = streamList[0]?.id
  }
})
</script>

<StreamSelector {streamList} {selectedStreamId} onselect={(streamId) => selectedStreamId = streamId} />

{#if selectedStreamId}
  <YearCalendar {store} streamId={selectedStreamId} year={2025} />
{/if}
