<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { SliceGrid } from '#lib/utils/slice-grid.js'

import { getTimeZoneStream } from '#lib/core/select/get-time-zone-stream.js'
import { getVisibleStreamList } from '#lib/core/select/get-visible-stream-list.js'
import { calcDuration } from '#lib/core/shape/calc-duration.js'

import { clockMin } from '#lib/utils/clock.js'
import { watch } from '#lib/utils/watch.svelte.js'

import { getLineHeight } from './get-line-height.js'
import Line from './Line.svelte'

type Props = {
  store: Store
  timeZone: string
  sliceGrid: SliceGrid
}

const { store, timeZone, sliceGrid }: Props = $props()

const { _: now } = watch(clockMin)
const { _: streamList } = $derived(watch(getVisibleStreamList(store)))
const { _: timeZoneStream } = $derived(watch(getTimeZoneStream(store)))

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

  {#each sliceGrid.rowList as row, rowIndex (rowIndex)}
    {@const prevRow = sliceGrid.rowList[rowIndex - 1]}
    <section style:--height={getLineHeight(calcDuration(row, now))}>
      <div class="cell time" style:--row={rowIndex + 2} style:--col="1"><a href="/edit/slice/{row.startedAt}">{formatTime(row.startedAt)}</a></div>

      {#each row.cellList as line, columnIndex (columnIndex)}
        {#if line && line.streamId !== timeZoneStream?.id}
          <div class="cell" style:--row={rowIndex + 2} style:--col={columnIndex + 2}>
            {#if line}
              {@const isEnd = line.stoppedAt === prevRow?.startedAt}
              {@const isStart = line.startedAt === row.startedAt}
              <Line
                {store}
                {line}
                {isStart}
                {isEnd}
              />
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
    column-gap: var(--size-2);
  }

  header, section {
    display: contents;
  }

  section:hover .cell {
    background: rgba(0, 0, 0, 5%);
  }

  .cell {
    grid-column: var(--col);
    grid-row: var(--row);
    white-space: pre-wrap;
    min-height: calc(var(--height) * 1px);

    &.time {
      font-size: var(--scale-000);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: end;
      padding: var(--size-2);
    }
  }

  a {
    text-decoration: none;
    font-family: var(--font-mono);
  }
</style>
