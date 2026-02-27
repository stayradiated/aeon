<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { Slice } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { getVisibleStreamList } from '#lib/core/select/get-visible-stream-list.js'

import { watch } from '#lib/utils/watch.svelte.js'

import Line from './Line.svelte'

type Props = {
  store: Store
  timeZone: string
  sliceList: Slice[]
}

const { store, timeZone, sliceList }: Props = $props()

const { _: streamList } = $derived(watch(getVisibleStreamList(store)))

// build an index of streamId → column index
// so we can quickly lookup where to render each cell
const streamColumnIndexRecord: Record<StreamId, number> = $derived(
  Object.fromEntries(streamList.map((stream, index) => [stream.id, index])),
)

const formatTime = (instant: number): string => {
  return dateFns.format(instant, 'HH:mm', { in: tz(timeZone) })
}
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
      <div class="cell" style:--row={index + 2} style:--col="1"><a href="/edit/slice/{slice.startedAt}">{formatTime(slice.startedAt)}</a></div>

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
    gap: var(--size-1);
  }

  header, section {
    display: contents;
  }

  .cell {
    grid-column: var(--col);
    grid-row: var(--row);
    white-space: pre-wrap;
  }

  a {
    text-decoration: none;
    font-family: var(--font-mono);
  }
</style>
