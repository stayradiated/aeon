<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Slice } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { getStreamList } from '#lib/core/select/get-stream-list.js'
import { getTimeZoneStream } from '#lib/core/select/get-time-zone-stream.js'

import { formatTime } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

import Line from './Line.svelte'

type Props = {
  store: Store
  timeZone: string
  sliceList: Slice[]
}

const { store, timeZone, sliceList }: Props = $props()

const { _: streamList } = $derived(watch(getStreamList(store)))
const { _: timeZoneStream } = $derived(watch(getTimeZoneStream(store)))

const filteredStreamList = $derived(
  streamList.filter((stream) => stream.id !== timeZoneStream?.id),
)

// build an index of streamId → column index
// so we can quickly lookup where to render each cell
const streamColumnIndexRecord: Record<StreamId, number> = $derived(
  Object.fromEntries(
    filteredStreamList.map((stream, index) => [stream.id, index]),
  ),
)
</script>

<div class="SliceList" style:--num-cols={1 + filteredStreamList.length}>
  <header>
    <h5>time</h5>
    {#each filteredStreamList as stream (stream.id)}
      <h5>{stream.name}</h5>
    {/each}
  </header>

  {#each sliceList as slice, index (index)}
    <section>
      <div class="cell" style:--row={index + 2} style:--col="1"><a href="/edit/slice/{slice.startedAt}">{formatTime(timeZone, slice.startedAt)}</a></div>

      {#each slice.lineList as line (line.streamId)}
        {@const streamColumnIndex = streamColumnIndexRecord[line.streamId]}
        {#if typeof streamColumnIndex === 'number'}
          <div class="cell" style:--row={index + 2} style:--col={streamColumnIndex + 2}>
            {#if line}
              <Line {store} {line} />
            {/if}
          </div>
        {/if}
      {/each}
    </section>
  {/each}
</div>

<style>
  .SliceList {
    display: grid;
    grid-template-columns: repeat(var(--num-cols), minmax(0, 1fr));
  }

  header, section {
    display: contents;
  }

  .cell {
    grid-column: var(--col);
    grid-row: var(--row);
    white-space: pre-wrap;
  }
</style>
