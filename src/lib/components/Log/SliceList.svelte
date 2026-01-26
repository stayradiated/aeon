<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Slice } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { getStreamList } from '#lib/core/select/get-stream-list.js'
import { getUserTimeZone } from '#lib/core/select/get-user-time-zone.js'

import { formatTime } from '#lib/utils/format-duration.js'
import { query } from '#lib/utils/query.js'

import Line from './Line.svelte'

type Props = {
  store: Store
  sliceList: Slice[]
}

const { store, sliceList }: Props = $props()

const { timeZone, streamList } = $derived(
  query(() => {
    return {
      timeZone: getUserTimeZone(store).value,
      streamList: getStreamList(store).value,
    }
  }),
)

// build an index of streamId → column index
// so we can quickly lookup where to render each cell
const streamColumnIndex: Record<StreamId, number> = $derived(
  Object.fromEntries(streamList.map((stream, index) => [stream.id, index])),
)
</script>

<div class="SliceList" style:--num-cols={1 + streamList.length}>
  <header>
    <h5>time</h5>
    {#each streamList as stream (stream.id)}
      <h5>{stream.name}</h5>
    {/each}
  </header>

  {#each sliceList as slice, index (index)}
    <section>
      <div class="cell" style:--col="1"><a href="/edit/slice/{slice.startedAt}">{formatTime(timeZone, slice.startedAt)}</a></div>

      {#each slice.lineList as line (line.streamId)}
        <div class="cell" style:--col={2 + (streamColumnIndex[line.streamId] ?? 0)}>
          {#if line}
            <Line {store} {line} />
          {/if}
        </div>
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
		white-space: pre-wrap;
	}
</style>
